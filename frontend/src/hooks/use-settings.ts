import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

export const usePublicSettings = () =>
  useQuery({
    queryKey: ['settings', 'public'],
    queryFn: api.fetchPublicSettings,
    staleTime: 60_000,
  });

export const useAdminSettings = () =>
  useQuery({
    queryKey: ['settings', 'admin'],
    queryFn: api.fetchAdminSettings,
  });

export const useUpdateSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      api.updateSetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};
