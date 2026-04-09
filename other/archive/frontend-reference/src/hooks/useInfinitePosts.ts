import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FeedResponse } from '@/types';

export function useInfinitePosts() {
  return useInfiniteQuery<FeedResponse>({
    queryKey: ['posts'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.set('cursor', cursor);
      const { data } = await api.get<{ data: FeedResponse }>(`/posts?${params}`);
      return data.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
