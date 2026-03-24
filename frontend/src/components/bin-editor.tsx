'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Loader2, Save, AlertCircle, ChevronDown, FolderOpen, Wand2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGroups } from '@/hooks/use-bins';
import { cn } from '@/lib/utils';

// Lazy-load Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const SLUG_RE = /^[a-zA-Z0-9_-]{3,50}$/;

interface BinEditorProps {
  defaultValues?: { name: string; group: string; slug?: string; content: unknown };
  /** Pre-fill group (used when navigating from group sidebar) */
  defaultGroup?: string;
  onSave: (data: { name: string; group: string; slug?: string; content: unknown }) => Promise<void>;
  saving?: boolean;
  /** Create mode: slug optional. Edit mode: slug shown and editable */
  isCreateMode?: boolean;
}

export function BinEditor({ defaultValues, defaultGroup, onSave, saving, isCreateMode }: BinEditorProps) {
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [group, setGroup] = useState(defaultValues?.group ?? defaultGroup ?? 'default');
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupInput, setGroupInput] = useState(defaultValues?.group ?? defaultGroup ?? 'default');
  const groupRef = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState(defaultValues?.slug ?? '');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState(
    JSON.stringify(defaultValues?.content ?? {}, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const { data: groups = [] } = useGroups();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setGroupOpen(false);
        // Commit typed value as group
        const val = groupInput.trim() || 'default';
        setGroup(val);
        setGroupInput(val);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [groupInput]);

  const selectGroup = (g: string) => {
    setGroup(g);
    setGroupInput(g);
    setGroupOpen(false);
  };

  // Show all groups when browsing; filter only when user has changed the input text
  const isTyping = groupInput !== group;
  const suggestions = isTyping
    ? groups.filter((g) => g.toLowerCase().includes(groupInput.toLowerCase()))
    : groups;

  const handleEditorChange = useCallback((value: string | undefined) => {
    const text = value ?? '';
    setJsonText(text);
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  }, []);

  const beautify = () => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
      setJsonError(null);
    } catch { /* keep existing error */ }
  };

  const minify = () => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText)));
      setJsonError(null);
    } catch { /* keep existing error */ }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlug(val);
    if (val && !SLUG_RE.test(val)) {
      setSlugError('3-50 chars: letters, numbers, - and _ only');
    } else {
      setSlugError(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    if (jsonError) return toast.error('Fix JSON errors before saving');
    if (slugError) return toast.error('Fix slug errors before saving');
    try {
      await onSave({
        name: name.trim(),
        group: groupInput.trim() || 'default',
        content: JSON.parse(jsonText),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      {/* Name + Group row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bin-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Name
          </Label>
          <Input
            id="bin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Config"
            className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40"
          />
        </div>
        {/* Group combobox */}
        <div className="space-y-1.5" ref={groupRef}>
          <Label htmlFor="bin-group" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Group
          </Label>
          <div className="relative">
            <Input
              id="bin-group"
              value={groupInput}
              onChange={(e) => { setGroupInput(e.target.value); setGroupOpen(true); }}
              onFocus={() => setGroupOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); selectGroup(groupInput.trim() || 'default'); }
                if (e.key === 'Escape') setGroupOpen(false);
              }}
              placeholder="default"
              autoComplete="off"
              className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40 pr-8"
            />
            <button
              type="button"
              onClick={() => setGroupOpen((o) => !o)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronDown className={cn('size-3.5 transition-transform', groupOpen && 'rotate-180')} />
            </button>

            {/* Dropdown */}
            {groupOpen && (
              <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border/60 bg-popover shadow-xl overflow-hidden">
                {suggestions.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto py-1">
                    {suggestions.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectGroup(g); }}
                        className={cn(
                          'w-full text-left flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors',
                          group === g
                            ? 'bg-primary/15 text-primary'
                            : 'text-foreground hover:bg-muted/60'
                        )}
                      >
                        <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
                        {g}
                      </button>
                    ))}
                  </div>
                ) : null}
                {/* Option to create new group if typed value doesn't match */}
                {groupInput.trim() && !groups.includes(groupInput.trim()) && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectGroup(groupInput.trim()); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 cursor-pointer border-t border-border/40"
                  >
                    <span className="text-xs bg-primary/15 rounded px-1.5 py-0.5 font-mono">+</span>
                    Create &quot;{groupInput.trim()}&quot;
                  </button>
                )}
                {suggestions.length === 0 && !groupInput.trim() && (
                  <p className="px-3 py-3 text-xs text-muted-foreground">No groups yet — type to create one</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slug field */}
      <div className="space-y-1.5">
        <Label htmlFor="bin-slug" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Slug {isCreateMode && <span className="normal-case font-normal">(optional)</span>}
        </Label>
        <Input
          id="bin-slug"
          value={slug}
          onChange={handleSlugChange}
          placeholder={isCreateMode ? 'my-config  (leave blank for auto-generated)' : ''}
          className="bg-muted/40 border-border/50 h-9 focus-visible:ring-primary/40 font-mono text-sm"
        />
        {slugError ? (
          <p className="flex items-center gap-1 text-[11px] text-destructive">
            <AlertCircle className="size-3" />
            {slugError}
          </p>
        ) : slug ? (
          <p className="text-[11px] text-muted-foreground font-mono">
            → /api/v2?target={slug}
          </p>
        ) : isCreateMode ? (
          <p className="text-[11px] text-muted-foreground">
            Leave blank to auto-generate a random slug
          </p>
        ) : null}
      </div>

      {/* Monaco editor */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            JSON Content
          </Label>
          <div className="flex items-center gap-1.5">
            {jsonError && (
              <span className="flex items-center gap-1 text-[11px] text-destructive mr-2">
                <AlertCircle className="size-3" />
                {jsonError}
              </span>
            )}
            <button
              type="button"
              onClick={beautify}
              title="Beautify"
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
            >
              <Wand2 className="size-3" />
              Beautify
            </button>
            <button
              type="button"
              onClick={minify}
              title="Minify"
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 cursor-pointer transition-colors"
            >
              <Minimize2 className="size-3" />
              Minify
            </button>
            {/* Save inline with toolbar */}
            <Button
              onClick={handleSave}
              disabled={saving || !!jsonError || !!slugError}
              size="sm"
              className="cursor-pointer gap-1.5 h-7 text-[11px] px-2.5"
            >
              {saving ? (
                <><Loader2 className="size-3 animate-spin" />Saving…</>
              ) : (
                <><Save className="size-3" />Save</>
              )}
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-border overflow-hidden ring-1 ring-transparent focus-within:ring-primary/30 transition-all shadow-sm flex-1 min-h-[200px]">
          <MonacoEditor
            height="100%"
            language="json"
            theme="light"
            value={jsonText}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'var(--font-geist-mono), "JetBrains Mono", monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: 'gutter',
            }}
          />
        </div>
      </div>

    </div>
  );
}
