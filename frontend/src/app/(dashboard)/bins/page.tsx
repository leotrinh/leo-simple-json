'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Copy, Trash2, ExternalLink, Layers, FolderOpen, FolderPlus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useBins, useDeleteBin } from '@/hooks/use-bins';
import { cn } from '@/lib/utils';
import type { JsonBin } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function groupBins(bins: JsonBin[]): Record<string, JsonBin[]> {
  return bins.reduce<Record<string, JsonBin[]>>((acc, bin) => {
    const g = bin.group || 'default';
    (acc[g] ??= []).push(bin);
    return acc;
  }, {});
}

export default function BinsPage() {
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState<string | undefined>();
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const groupInputRef = useRef<HTMLInputElement>(null);
  const { data: bins = [], isLoading } = useBins();
  const deleteMutation = useDeleteBin();

  const grouped = groupBins(bins);
  const groups = Object.keys(grouped).sort();
  const displayed = activeGroup ? (grouped[activeGroup] ?? []) : bins;

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`${API_URL}/api/v2?target=${slug}`);
    toast.success('URL copied!');
  };

  // Auto-focus input when adding group
  useEffect(() => {
    if (addingGroup) groupInputRef.current?.focus();
  }, [addingGroup]);

  const submitNewGroup = () => {
    const name = newGroupName.trim();
    if (!name) { setAddingGroup(false); return; }
    setNewGroupName('');
    setAddingGroup(false);
    router.push(`/bins/new?group=${encodeURIComponent(name)}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.slug);
      toast.success('Bin deleted');
    } catch {
      toast.error('Failed to delete bin');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading bins...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Group sidebar */}
      <aside className="w-48 shrink-0 border-r border-border/50 p-3 space-y-0.5">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Groups
          </p>
          <button
            onClick={() => setAddingGroup(true)}
            title="Add group"
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <FolderPlus className="size-3.5" />
          </button>
        </div>
        <button
          onClick={() => setActiveGroup(undefined)}
          className={cn(
            'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
            !activeGroup
              ? 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <Layers className="size-3.5 shrink-0" />
          <span className="truncate">All</span>
          <span className="ml-auto text-xs opacity-70">{bins.length}</span>
        </button>
        {/* Inline new group input */}
        {addingGroup && (
          <div className="px-1 py-1">
            <input
              ref={groupInputRef}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewGroup();
                if (e.key === 'Escape') { setAddingGroup(false); setNewGroupName(''); }
              }}
              onBlur={submitNewGroup}
              placeholder="Group name…"
              className="w-full rounded-md bg-muted/60 border border-primary/30 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        )}
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={cn(
              'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
              activeGroup === g
                ? 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <FolderOpen className="size-3.5 shrink-0" />
            <span className="truncate">{g}</span>
            <span className="ml-auto text-xs opacity-70">{grouped[g].length}</span>
          </button>
        ))}
      </aside>

      {/* Bins list */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold">
              {activeGroup ? activeGroup : 'All Bins'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {displayed.length} {displayed.length === 1 ? 'bin' : 'bins'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(`/bins/new${activeGroup ? `?group=${encodeURIComponent(activeGroup)}` : ''}`)}
            className="cursor-pointer gap-1.5"
          >
            <Plus className="size-3.5" />
            New Bin
          </Button>
        </div>

        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="size-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <Layers className="size-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">No bins yet</p>
              <button
                onClick={() => router.push(`/bins/new${activeGroup ? `?group=${encodeURIComponent(activeGroup)}` : ''}`)}
                className="text-xs text-primary hover:underline mt-1 cursor-pointer"
              >
                {activeGroup ? `Create bin in "${activeGroup}"` : 'Create your first bin'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((bin) => (
              <div
                key={bin._id}
                onClick={() => router.push(`/bins/${bin.slug}`)}
                className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{bin.name}</span>
                    {bin.group && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 py-0 h-4">
                        {bin.group}
                      </Badge>
                    )}
                    {bin.isPublic && (
                      <Badge className="text-[10px] shrink-0 py-0 h-4 bg-primary/15 text-primary border-primary/20 hover:bg-primary/20">
                        public
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                    /api/v2?target={bin.slug}
                  </p>
                </div>
                <div
                  className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyUrl(bin.slug)}
                    title="Copy public URL"
                    className="cursor-pointer h-7 w-7"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <a
                    href={`${API_URL}/api/v2?target=${bin.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon-sm" title="Open public URL" className="cursor-pointer h-7 w-7">
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget({ slug: bin.slug, name: bin.name })}
                    className="text-destructive hover:text-destructive cursor-pointer h-7 w-7"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This action cannot be undone. The bin and its public URL will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
