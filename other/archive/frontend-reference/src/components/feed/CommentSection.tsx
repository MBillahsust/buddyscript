'use client';

import { useState } from 'react';
import { CommentItem } from './CommentItem';
import { CommentComposer } from './CommentComposer';
import { useComments } from '@/hooks/useComments';
import type { User } from '@/types';

const PREVIEW_COUNT = 2;

interface CommentSectionProps {
  postId: string;
  currentUser: User;
  isDark?: boolean;
}

export function CommentSection({ postId, currentUser, isDark = false }: CommentSectionProps) {
  const { commentsQuery, createComment, deleteComment, createReply, deleteReply } =
    useComments(postId, true);
  const [showAll, setShowAll] = useState(false);

  const allComments = commentsQuery.data?.comments ?? [];
  const hiddenCount = Math.max(0, allComments.length - PREVIEW_COUNT);
  const visibleComments = showAll ? allComments : allComments.slice(0, PREVIEW_COUNT);

  return (
    <div className="_feed_inner_timeline_cooment_area">
      <CommentComposer
        currentUser={currentUser}
        onSubmit={async (content) => { await createComment.mutateAsync(content); }}
      />

      <div className="_timline_comment_main">
        {commentsQuery.isLoading && (
          <p style={{ textAlign: 'center', padding: 12, color: isDark ? '#aaa' : '#888', fontSize: 'clamp(12px, 2vw, 13px)' }}>
            Loading comments...
          </p>
        )}

        {!commentsQuery.isLoading && hiddenCount > 0 && !showAll && (
          <button
            type="button"
            className="_previous_comment_txt"
            onClick={() => setShowAll(true)}
            style={{ display: 'block', marginBottom: 8 }}
          >
            View {hiddenCount} previous comment{hiddenCount !== 1 ? 's' : ''}
          </button>
        )}

        {!commentsQuery.isLoading && hiddenCount > 0 && showAll && (
          <button
            type="button"
            className="_previous_comment_txt"
            onClick={() => setShowAll(false)}
            style={{ display: 'block', marginBottom: 8 }}
          >
            Hide comments
          </button>
        )}

        {visibleComments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            currentUser={currentUser}
            isDark={isDark}
            onDelete={(id) => deleteComment.mutate(id)}
            deleting={deleteComment.isPending}
            onCreateReply={async (commentId, content) => {
              await createReply.mutateAsync({ commentId, content });
            }}
            onDeleteReply={async (replyId, commentId) => {
              await deleteReply.mutateAsync({ replyId, commentId });
            }}
          />
        ))}

        {!commentsQuery.isLoading && allComments.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', fontSize: 'clamp(12px, 2vw, 13px)', padding: '8px 0' }}>
            No comments yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
