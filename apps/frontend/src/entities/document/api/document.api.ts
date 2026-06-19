import type {
  CreateDocumentInput,
  DocumentDetail,
  DocumentNode,
  DocumentTreeNode,
  MoveDocumentInput,
  UpdateDocumentInput,
} from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const documentApi = {
  tree: () => apiClient.get<never>('/docs/tree').then((res) => unwrap<DocumentTreeNode[]>(res)),

  getById: (id: string) =>
    apiClient.get<never>(`/docs/${id}`).then((res) => unwrap<DocumentDetail>(res)),

  create: (input: CreateDocumentInput) =>
    apiClient.post<never>('/docs', input).then((res) => unwrap<DocumentNode>(res)),

  update: (id: string, input: UpdateDocumentInput) =>
    apiClient.patch<never>(`/docs/${id}`, input).then((res) => unwrap<DocumentNode>(res)),

  move: (id: string, input: MoveDocumentInput) =>
    apiClient.patch<never>(`/docs/${id}/move`, input).then((res) => unwrap<DocumentNode>(res)),

  delete: (id: string) => apiClient.delete(`/docs/${id}`).then(() => undefined),
};
