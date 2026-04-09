import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Post } from '@/types';

interface CreatePostInput {
  content: string;
  imageUrl?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      const { data } = await api.post<{ data: { post: Post } }>('/posts', input);
      return data.data.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
