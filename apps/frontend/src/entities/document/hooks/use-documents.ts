import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { documentApi } from '../api/document.api';

export const documentKeys = {
  tree: ['docs', 'tree'] as const,
  detail: (id: string) => ['docs', id] as const,
};

export function useDocumentTree() {
  const status = useAuthStore((s) => s.status);

  return useQuery({
    queryKey: documentKeys.tree,
    queryFn: documentApi.tree,
    enabled: status === 'authenticated',
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(id ?? ''),
    queryFn: () => documentApi.getById(id!),
    enabled: Boolean(id),
  });
}
