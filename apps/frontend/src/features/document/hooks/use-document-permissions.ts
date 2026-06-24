import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentPermission, SetDocumentPermissionInput } from '@planforge/shared';
import { documentApi } from '@/entities/document/api/document.api';

const permissionsKey = (id: string) => ['docs', id, 'permissions'] as const;

export function useDocumentPermissions(docId: string | undefined) {
  return useQuery({
    queryKey: permissionsKey(docId ?? ''),
    queryFn: () => documentApi.listPermissions(docId!),
    enabled: Boolean(docId),
  });
}

export function useSetDocumentPermission(docId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetDocumentPermissionInput) => documentApi.setPermission(docId, input),
    onSuccess: (list: DocumentPermission[]) =>
      queryClient.setQueryData(permissionsKey(docId), list),
  });
}

export function useRemoveDocumentPermission(docId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => documentApi.removePermission(docId, userId),
    onSuccess: (list: DocumentPermission[]) =>
      queryClient.setQueryData(permissionsKey(docId), list),
  });
}
