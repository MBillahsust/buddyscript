import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LikersResponse, LikeTarget } from '@/types';

export function useLikers(target: LikeTarget, targetId: string, limit: number = 5) {
  const path =
    target === 'post'
      ? `/posts/${targetId}/likes`
      : target === 'comment'
      ? `/comments/${targetId}/likes`
      : `/replies/${targetId}/likes`;

  return useQuery<LikersResponse>({
    queryKey: ['likers', target, targetId, limit],
    queryFn: async () => {
      const { data } = await api.get<{ data: LikersResponse }>(
        `${path}?limit=${limit}`
      );
      return data.data;
    },
  });
}

