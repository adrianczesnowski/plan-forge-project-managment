import type { SearchResults } from '@planforge/shared';
import { apiClient, unwrap } from '@/shared/lib/api-client';

export const searchApi = {
  query: (q: string) =>
    apiClient.get<never>('/search', { params: { q } }).then((res) => unwrap<SearchResults>(res)),
};
