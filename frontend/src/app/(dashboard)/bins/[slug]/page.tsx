'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, ExternalLink, Trash2, ArrowLeft, Loader2, Search, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { useBin, useBins, useUpdateBin, useDeleteBin } from '@/hooks/use-bins';
import { BinEditor } from '@/components/bin-editor';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function EditBinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: bin, isLoading } = useBin(slug);
  const { data: allBins = [] } = useBins();
  const updateBin = useUpdateBin(slug);
  const deleteBin = useDeleteBin();

  const publicUrl = `${API_URL}/api/v2?target=${slug}`;

  // All unique groups derived from bins
  const allGroups = [...new Set(allBins.map((b) => b.group).filter(Boolean))].sort() as string[];

  // Active group: override state OR follow current bin's group
  const currentGroup = activeGroup ?? bin?.group ?? 'default';

  // Sidebar: bins in current group, filtered by search
  const groupBins = allBins.filter(
    (b) => b.group === currentGroup &&
      (search === '' || b.name.toLowerCase().includes(search.toLowerCase()))
  );

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL copied!');
  };

  const handleSave = async (data: { name: string; group: string; slug?: string; content: unknown }) => {
    const result = await updateBin.mutateAsync(data);
    toast.success('Saved');
    // If slug changed, redirect to new URL
    if (result.slug !== slug) {
      router.replace(`/bins/${result.slug}`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBin.mutateAsync(slug);
      toast.success('Bin deleted');
      router.push('/bins');
    } catch {
      toast.error('Failed to delete bin');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!bin) {
    return <div className="p-8 text-sm text-destructive">Bin not found</div>;
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: bins in same group */}
      <aside className="w-52 shrink-0 border-r border-border/60 flex flex-col bg-muted/30">
        {/* Group selector */}
        <div className="px-3 pt-3 pb-2 border-b border-border/40">
          <div className="relative mb-2">
            <FolderOpen className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={currentGroup}
              onChange={(e) => { setActiveGroup(e.target.value); setSearch(''); }}
              className="w-full appearance-none pl-6 pr-6 py-1.5 text-xs font-semibold bg-background border border-border/60 rounded-md outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer text-foreground"
            >
              {allGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-[10px]">▾</span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-md bg-background border border-border/60 outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Bins list */}
        <div className="flex-1 overflow-y-auto py-1">
          {groupBins.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No results</p>
          ) : (
            groupBins.map((b) => (
              <button
                key={b._id}
                onClick={() => router.push(`/bins/${b.slug}`)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer',
                  b.slug === slug
                    ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                    : 'text-foreground hover:bg-muted/60 border-l-2 border-transparent'
                )}
              >
                <p className="truncate font-medium">{b.name}</p>
                <p className="truncate text-muted-foreground font-mono mt-0.5 text-[10px]">
                  {b.slug}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Footer: back link */}
        <div className="p-2 border-t border-border/40">
          <button
            onClick={() => router.push('/bins')}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full px-2 py-1.5 rounded hover:bg-muted/60"
          >
            <ArrowLeft className="size-3" />
            All Bins
          </button>
        </div>
      </aside>

      {/* Main editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold truncate">{bin.name}</h1>
                {bin.group && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-4 shrink-0">
                    {bin.group}
                  </Badge>
                )}
                {bin.isPublic && (
                  <Badge className="text-[10px] py-0 h-4 shrink-0 bg-primary/15 text-primary border-primary/20">
                    public
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{publicUrl}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={copyUrl}
                className="cursor-pointer h-8 gap-1.5 border-border/60 text-xs"
              >
                <Copy className="size-3.5" />
                Copy URL
              </Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="cursor-pointer h-8 gap-1.5 border-border/60 text-xs">
                  <ExternalLink className="size-3.5" />
                  Open
                </Button>
              </a>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                className="cursor-pointer h-8 gap-1.5 text-xs"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>

          {/* key forces remount when bin data loads so defaultValues initializes correctly */}
          <div className="flex-1 flex flex-col min-h-0">
            <BinEditor
              key={bin._id}
              defaultValues={{ name: bin.name, group: bin.group, slug: bin.slug, content: bin.content }}
              onSave={handleSave}
              saving={updateBin.isPending}
            />
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${bin.name}"?`}
        description="This action cannot be undone. The bin and its public URL will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
