import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LinkDocumentInput, ProjectDocLink } from '@planforge/shared';
import { documentApi } from '@/entities/document/api/document.api';

const projectDocsKey = (projectId: string) => ['projects', projectId, 'docs'] as const;

export function useProjectDocs(projectId: string | undefined) {
  return useQuery({
    queryKey: projectDocsKey(projectId ?? ''),
    queryFn: () => documentApi.listProjectDocs(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useLinkProjectDoc(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LinkDocumentInput) => documentApi.linkProjectDoc(projectId, input),
    onSuccess: (list: ProjectDocLink[]) =>
      queryClient.setQueryData(projectDocsKey(projectId), list),
  });
}

export function useUnlinkProjectDoc(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => documentApi.unlinkProjectDoc(projectId, linkId),
    onSuccess: (list: ProjectDocLink[]) =>
      queryClient.setQueryData(projectDocsKey(projectId), list),
  });
}
