import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Comment, CommentsResponse, FeedResponse, Reply, RepliesResponse } from '@/types';
import type { InfiniteData } from '@tanstack/react-query';

export function useComments(postId: string, enabled = true) {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery<CommentsResponse>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await api.get<{ data: CommentsResponse }>(
        `/posts/${postId}/comments?limit=50`,
      );
      return data.data;
    },
    enabled,
  });

  const updatePostCommentCount = (delta: number) => {
    queryClient.setQueriesData<InfiniteData<FeedResponse>>(
      { queryKey: ['posts'] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            posts: page.posts.map(p =>
              p.id === postId
                ? { ...p, commentsCount: Math.max(0, p.commentsCount + delta) }
                : p,
            ),
          })),
        };
      },
    );
  };

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<{ data: { comment: Comment } }>(
        `/posts/${postId}/comments`,
        { content },
      );
      return data.data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      updatePostCommentCount(1);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      updatePostCommentCount(-1);
    },
  });

  const createReply = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data } = await api.post<{ data: { reply: Reply } }>(
        `/comments/${commentId}/replies`,
        { content },
      );
      return data.data.reply;
    },
    onSuccess: (_data, { commentId }) =>
      queryClient.invalidateQueries({ queryKey: ['replies', commentId] }),
  });

  const deleteReply = useMutation({
    mutationFn: async ({ replyId, commentId }: { replyId: string; commentId: string }) => {
      await api.delete(`/replies/${replyId}`);
      return commentId;
    },
    onSuccess: (_data, { commentId }) =>
      queryClient.invalidateQueries({ queryKey: ['replies', commentId] }),
  });

  return { commentsQuery, createComment, deleteComment, createReply, deleteReply };
}

export function useReplies(commentId: string, enabled = false) {
  return useQuery<RepliesResponse>({
    queryKey: ['replies', commentId],
    queryFn: async () => {
      const { data } = await api.get<{ data: RepliesResponse }>(
        `/comments/${commentId}/replies`,
      );
      return data.data;
    },
    enabled,
  });
}
