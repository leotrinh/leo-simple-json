'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Lazy-load Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface BinEditorProps {
  defaultValues?: { name: string; group: string; content: unknown };
  onSave: (data: { name: string; group: string; content: unknown }) => Promise<void>;
  saving?: boolean;
}

export function BinEditor({ defaultValues, onSave, saving }: BinEditorProps) {
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [group, setGroup] = useState(defaultValues?.group ?? 'default');
  const [jsonText, setJsonText] = useState(
    JSON.stringify(defaultValues?.content ?? {}, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

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

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    if (jsonError) return toast.error('Fix JSON errors before saving');
    try {
      await onSave({ name: name.trim(), group: group.trim() || 'default', content: JSON.parse(jsonText) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="bin-name">Name</Label>
          <Input
            id="bin-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Config"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bin-group">Group</Label>
          <Input
            id="bin-group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="default"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>JSON Content</Label>
          {jsonError && <span className="text-xs text-destructive">{jsonError}</span>}
        </div>
        <div className="rounded-lg border overflow-hidden" style={{ height: 420 }}>
          <MonacoEditor
            height="420px"
            language="json"
            theme="vs-dark"
            value={jsonText}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !!jsonError}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
