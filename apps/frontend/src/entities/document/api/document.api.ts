import type {
  CreateDocumentInput,
  DocumentDetail,
  DocumentNode,
  DocumentPermission,
  DocumentTreeNode,
  LinkDocumentInput,
  MoveDocumentInput,
  ProjectDocLink,
  SetDocumentPermissionInput,
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

  listPermissions: (id: string) =>
    apiClient
      .get<never>(`/docs/${id}/permissions`)
      .then((res) => unwrap<DocumentPermission[]>(res)),

  setPermission: (id: string, input: SetDocumentPermissionInput) =>
    apiClient
      .post<never>(`/docs/${id}/permissions`, input)
      .then((res) => unwrap<DocumentPermission[]>(res)),

  removePermission: (id: string, userId: string) =>
    apiClient
      .delete<never>(`/docs/${id}/permissions/${userId}`)
      .then((res) => unwrap<DocumentPermission[]>(res)),

  listProjectDocs: (projectId: string) =>
    apiClient
      .get<never>(`/projects/${projectId}/docs`)
      .then((res) => unwrap<ProjectDocLink[]>(res)),

  linkProjectDoc: (projectId: string, input: LinkDocumentInput) =>
    apiClient
      .post<never>(`/projects/${projectId}/docs`, input)
      .then((res) => unwrap<ProjectDocLink[]>(res)),

  unlinkProjectDoc: (projectId: string, linkId: string) =>
    apiClient
      .delete<never>(`/projects/${projectId}/docs/${linkId}`)
      .then((res) => unwrap<ProjectDocLink[]>(res)),
};
