import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import type { CreateBinInput, UpdateBinInput } from '@/types';

/** Derive unique groups from already-loaded bins — no extra API call, no auth timing issues */
export const useGroups = () => {
  const { data: bins = [] } = useBins();
  const groups = [...new Set(bins.map((b) => b.group).filter(Boolean))].sort() as string[];
  return { data: groups };
};

export const useBins = (group?: string) =>
  useQuery({ queryKey: ['bins', group], queryFn: () => api.fetchBins(group) });

export const useBin = (slug: string) =>
  useQuery({ queryKey: ['bin', slug], queryFn: () => api.fetchBin(slug), enabled: !!slug });

export const useCreateBin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBinInput) => api.createBin(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bins'] });
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

export const useUpdateBin = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBinInput) => api.updateBin(slug, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['bins'] });
      qc.invalidateQueries({ queryKey: ['bin', slug] });
      // If slug changed, also invalidate the new slug query
      if (data.slug !== slug) {
        qc.invalidateQueries({ queryKey: ['bin', data.slug] });
      }
    },
  });
};

export const useDeleteBin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.deleteBin(slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bins'] }),
  });
};
