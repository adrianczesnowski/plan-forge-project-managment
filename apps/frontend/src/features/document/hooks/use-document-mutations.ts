import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateDocumentInput,
  DocumentNode,
  MoveDocumentInput,
  UpdateDocumentInput,
} from '@planforge/shared';
import { documentApi } from '@/entities/document/api/document.api';
import { documentKeys } from '@/entities/document/hooks/use-documents';

function useInvalidateTree() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: documentKeys.tree });
}

export function useCreateDocument() {
  const invalidate = useInvalidateTree();
  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDocumentInput }) =>
      documentApi.update(id, input),
    onSuccess: (node: DocumentNode) => {
      void queryClient.invalidateQueries({ queryKey: documentKeys.tree });
      void queryClient.invalidateQueries({ queryKey: documentKeys.detail(node.id) });
    },
  });
}

export function useMoveDocument() {
  const invalidate = useInvalidateTree();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MoveDocumentInput }) =>
      documentApi.move(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDocument() {
  const invalidate = useInvalidateTree();
  return useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: invalidate,
  });
}
