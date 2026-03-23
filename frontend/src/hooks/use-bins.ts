import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import type { CreateBinInput, UpdateBinInput } from '@/types';

export const useBins = (group?: string) =>
  useQuery({ queryKey: ['bins', group], queryFn: () => api.fetchBins(group) });

export const useBin = (slug: string) =>
  useQuery({ queryKey: ['bin', slug], queryFn: () => api.fetchBin(slug), enabled: !!slug });

export const useCreateBin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBinInput) => api.createBin(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bins'] }),
  });
};

export const useUpdateBin = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBinInput) => api.updateBin(slug, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bins'] });
      qc.invalidateQueries({ queryKey: ['bin', slug] });
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
