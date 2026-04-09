'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/Avatar';
import { ReplyItem } from './ReplyItem';
import { CommentComposer } from './CommentComposer';
import { useLike } from '@/hooks/useLike';
import { useReplies } from '@/hooks/useComments';
import { LikesModal } from './LikesModal';
import type { Comment, User } from '@/types';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUser: User;
  isDark?: boolean;
  onDelete: (commentId: string) => void;
  deleting: boolean;
  onCreateReply: (commentId: string, content: string) => Promise<void>;
  onDeleteReply: (replyId: string, commentId: string) => Promise<void>;
}

export function CommentItem({
  comment,
  postId,
  currentUser,
  isDark = false,
  onDelete,
  deleting,
  onCreateReply,
  onDeleteReply,
}: CommentItemProps) {
  const likeMutation = useLike();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const isAuthor = comment.author.id === currentUser.id;

  const { data: repliesData, isLoading: repliesLoading } = useReplies(comment.id, showReplies);

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <Avatar
          avatarUrl={comment.author.avatarUrl}
          firstName={comment.author.firstName}
          lastName={comment.author.lastName}
          size={36}
          className="_comment_img1"
        />
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_header">
              <h4 className="_comment_name_title" style={{ fontSize: 'clamp(12px, 2vw, 13px)' }}>
                {comment.author.firstName} {comment.author.lastName}
              </h4>
              <span style={{ color: '#999', fontSize: 'clamp(11px, 1.5vw, 12px)', marginLeft: 'clamp(4px, 1vw, 6px)' }}>· {timeAgo}</span>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{comment.content}</span>
            </p>
          </div>

          {comment.likesCount > 0 && (
            <div className="_comment_reactions_inline">
              <div className="_total_react">
                <span className="_reaction_like">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#1890FF" stroke="none">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </span>
                <span className="_reaction_heart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#E0245E" stroke="none">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </span>
              </div>
              <button
                onClick={() => setShowLikesModal(true)}
                className="_secondary_text_btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'clamp(11px, 1.5vw, 12px)', color: isDark ? '#aaa' : '#666', marginLeft: 4 }}
              >
                {comment.likesCount}
              </button>
            </div>
          )}

          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 6px)', fontSize: 'clamp(11px, 1.5vw, 12px)' }}>
                <span
                  style={{ cursor: 'pointer', color: comment.userLiked ? '#E0245E' : '#555', fontWeight: 600 }}
                  onClick={() => likeMutation.mutate({ target: 'comment', targetId: comment.id, postId })}
                >
                  Like
                </span>
                <span style={{ color: '#ccc' }}>·</span>
                <span
                  style={{ cursor: 'pointer', color: '#555', fontWeight: 600 }}
                  onClick={() => setShowReplyComposer(p => !p)}
                >
                  Reply
                </span>
                {isAuthor && (
                  <>
                    <span style={{ color: '#ccc' }}>·</span>
                    <span
                      style={{ cursor: 'pointer', color: '#555', fontWeight: 600 }}
                      onClick={() => !deleting && onDelete(comment.id)}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {comment.repliesCount > 0 && (
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={() => setShowReplies(p => !p)}
              style={{ marginTop: 8 }}
            >
              {showReplies ? '─ Hide replies' : `↳ View ${comment.repliesCount} repl${comment.repliesCount !== 1 ? 'ies' : 'y'}`}
            </button>
          )}

          {showReplies && (
            <div style={{ marginTop: 8 }}>
              {repliesLoading && <p style={{ fontSize: 'clamp(11px, 1.5vw, 12px)', color: isDark ? '#aaa' : '#888' }}>Loading replies...</p>}
              {repliesData?.replies.map(reply => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  postId={postId}
                  commentId={comment.id}
                  currentUser={currentUser}
                  isDark={isDark}
                  onDelete={(replyId) => onDeleteReply(replyId, comment.id)}
                  deleting={false}
                />
              ))}
            </div>
          )}

          {showReplyComposer && (
            <CommentComposer
              currentUser={currentUser}
              onSubmit={async (content) => {
                await onCreateReply(comment.id, content);
                setShowReplies(true);
                setShowReplyComposer(false);
              }}
              placeholder={`Reply to ${comment.author.firstName}...`}
              compact
            />
          )}
        </div>
      </div>

      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        target="comment"
        targetId={comment.id}
        count={comment.likesCount}
      />
    </div>
  );
}
