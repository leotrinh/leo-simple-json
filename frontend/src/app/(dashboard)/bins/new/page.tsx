'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreateBin } from '@/hooks/use-bins';
import { BinEditor } from '@/components/bin-editor';

export default function NewBinPage() {
  const router = useRouter();
  const createBin = useCreateBin();

  const handleSave = async (data: { name: string; group: string; content: unknown }) => {
    const bin = await createBin.mutateAsync(data);
    toast.success('Bin created');
    router.push(`/bins/${bin.slug}`);
  };

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-lg font-semibold mb-6">New Bin</h1>
      <BinEditor onSave={handleSave} saving={createBin.isPending} />
    </div>
  );
}
