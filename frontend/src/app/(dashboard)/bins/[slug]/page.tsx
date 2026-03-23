'use client';

import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBin, useUpdateBin, useDeleteBin } from '@/hooks/use-bins';
import { BinEditor } from '@/components/bin-editor';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function EditBinPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: bin, isLoading } = useBin(slug);
  const updateBin = useUpdateBin(slug);
  const deleteBin = useDeleteBin();

  const publicUrl = `${API_URL}/api/v2?target=${slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL copied!');
  };

  const handleSave = async (data: { name: string; group: string; content: unknown }) => {
    await updateBin.mutateAsync(data);
    toast.success('Saved');
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${bin?.name}"?`)) return;
    await deleteBin.mutateAsync(slug);
    toast.success('Bin deleted');
    router.push('/bins');
  };

  if (isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading...</div>;
  if (!bin) return <div className="p-6 text-sm text-destructive">Bin not found</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">{bin.name}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyUrl}>
            <Copy className="size-3.5" />
            Copy URL
          </Button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="size-3.5" />
              Open
            </Button>
          </a>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Public URL display */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
        <span className="text-xs text-muted-foreground">Public URL:</span>
        <code className="flex-1 text-xs font-mono truncate">{publicUrl}</code>
      </div>

      <BinEditor
        defaultValues={{ name: bin.name, group: bin.group, content: bin.content }}
        onSave={handleSave}
        saving={updateBin.isPending}
      />
    </div>
  );
}
