'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateBin } from '@/hooks/use-bins';
import { BinEditor } from '@/components/bin-editor';

export default function NewBinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultGroup = searchParams.get('group') ?? undefined;
  const createBin = useCreateBin();

  const handleSave = async (data: { name: string; group: string; slug?: string; content: unknown }) => {
    const bin = await createBin.mutateAsync(data);
    toast.success('Bin created');
    router.push(`/bins/${bin.slug}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push('/bins')}
          className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground h-7 w-7"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-base font-semibold">New Bin</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {defaultGroup ? `In group "${defaultGroup}"` : 'Create a new JSON bin'}
          </p>
        </div>
      </div>

      <BinEditor
        onSave={handleSave}
        saving={createBin.isPending}
        isCreateMode
        defaultGroup={defaultGroup}
      />
    </div>
  );
}
