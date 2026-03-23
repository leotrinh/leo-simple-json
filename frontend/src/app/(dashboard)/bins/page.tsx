'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Copy, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBins, useDeleteBin } from '@/hooks/use-bins';
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
  const { data: bins = [], isLoading } = useBins();
  const deleteMutation = useDeleteBin();

  const grouped = groupBins(bins);
  const groups = Object.keys(grouped).sort();
  const displayed = activeGroup ? (grouped[activeGroup] ?? []) : bins;

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`${API_URL}/api/v2?target=${slug}`);
    toast.success('URL copied!');
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(slug);
      toast.success('Bin deleted');
    } catch {
      toast.error('Failed to delete bin');
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="flex h-full">
      {/* Group sidebar */}
      <aside className="w-44 shrink-0 border-r p-3 space-y-1">
        <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Groups</p>
        <button
          onClick={() => setActiveGroup(undefined)}
          className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${!activeGroup ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
        >
          All ({bins.length})
        </button>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${activeGroup === g ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
          >
            {g} ({grouped[g].length})
          </button>
        ))}
      </aside>

      {/* Bins list */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">
            {activeGroup ? `Group: ${activeGroup}` : 'All Bins'}
          </h1>
          <Button size="sm" onClick={() => router.push('/bins/new')}>
            <Plus className="size-4" />
            New Bin
          </Button>
        </div>

        {displayed.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No bins yet.{' '}
            <button onClick={() => router.push('/bins/new')} className="underline">
              Create one
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((bin) => (
              <div
                key={bin._id}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{bin.name}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">{bin.group}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                    /api/v2?target={bin.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => copyUrl(bin.slug)} title="Copy URL">
                    <Copy className="size-3.5" />
                  </Button>
                  <a
                    href={`${API_URL}/api/v2?target=${bin.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon-sm" title="Open public URL">
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </a>
                  <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/bins/${bin.slug}`)} title="Edit">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(bin.slug, bin.name)}
                    className="text-destructive hover:text-destructive"
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
    </div>
  );
}
