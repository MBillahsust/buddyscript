'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { CommentSection } from './CommentSection';
import { LikesModal } from './LikesModal';
import { AvatarStack } from './AvatarStack';
import { useLike } from '@/hooks/useLike';
import { useLikers } from '@/hooks/useLikers';
import type { Post, User } from '@/types';

interface PostCardProps {
  post: Post;
  currentUser: User;
  isDark?: boolean;
}

export function PostCard({ post, currentUser, isDark = false }: PostCardProps) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const likeMutation = useLike();
  const { data: likersData } = useLikers('post', post.id, 3);

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  const isAuthor = post.author.id === currentUser.id;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${post.id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div className="_feed_inner_timeline_post_box">
            <div className="_feed_inner_timeline_post_box_image">
              <Avatar
                avatarUrl={post.author.avatarUrl}
                firstName={post.author.firstName}
                lastName={post.author.lastName}
                size={44}
                className="_post_img"
              />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {post.author.firstName} {post.author.lastName}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo} &middot;{' '}
                {post.visibility === 'PRIVATE' ? 'Private' : 'Public'}
              </p>
            </div>
          </div>

          {isAuthor && (
            <div className="_feed_inner_timeline_post_box_dropdown">
              <div className="_feed_timeline_post_dropdown">
                <button
                  type="button"
                  className="_feed_timeline_post_dropdown_link"
                  onClick={() => setDropdownOpen(p => !p)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                    <circle cx="2" cy="2" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="8" r="2" fill="#C4C4C4" />
                    <circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                  </svg>
                </button>
              </div>
              {dropdownOpen && (
                <div className="_feed_timeline_dropdown _timeline_dropdown" style={{ display: 'block' }}>
                  <ul className="_feed_timeline_dropdown_list">
                    <li className="_feed_timeline_dropdown_item">
                      <button
                        className="_feed_timeline_dropdown_link"
                        style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowDeleteModal(true);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18">
                            <path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5" />
                          </svg>
                        </span>
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Post'}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="_feed_inner_timeline_post_title" style={{ margin: '12px 0', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>

        {post.imageUrl && (
          <div className="_feed_inner_timeline_image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.imageUrl} alt="" className="_time_img" style={{ borderRadius: 8, maxWidth: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}
      </div>

      <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
        <div className="_feed_inner_timeline_total_reacts_image" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)' }}>
          {post.likesCount > 0 && (
            <>
              <AvatarStack
                likers={likersData?.likers || []}
                totalCount={post.likesCount}
                maxVisible={3}
                onViewAll={() => setShowLikesModal(true)}
                isDark={isDark}
              />
            </>
          )}
        </div>
        <div className="_feed_inner_timeline_total_reacts_txt">
          <p className="_feed_inner_timeline_total_reacts_para1">
            <button
              type="button"
              className="_secondary_text_btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'clamp(12px, 2vw, 13px)', color: isDark ? '#aaa' : '#666', padding: 0 }}
              onClick={() => setShowComments(p => !p)}
            >
              <span style={{ fontWeight: 600 }}>{post.commentsCount}</span> Comment{post.commentsCount !== 1 ? 's' : ''}
            </button>
          </p>
        </div>
      </div>

      <div className="_feed_inner_timeline_reaction">
        <button
          className={`_feed_inner_timeline_reaction_emoji _feed_reaction${post.userLiked ? ' _feed_reaction_active' : ''}`}
          type="button"
          onClick={() => likeMutation.mutate({ target: 'post', targetId: post.id, postId: post.id })}
          disabled={likeMutation.isPending}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={post.userLiked ? '#E0245E' : 'none'}
                stroke={post.userLiked ? '#E0245E' : '#000'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Like
            </span>
          </span>
        </button>

        <button
          className={`_feed_inner_timeline_reaction_comment _feed_reaction${showComments ? ' _feed_reaction_active' : ''}`}
          onClick={() => setShowComments(p => !p)}
        >
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z"/>
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563"/>
              </svg>
              Comment
            </span>
          </span>
        </button>

        <button className="_feed_inner_timeline_reaction_share _feed_reaction" type="button">
          <span className="_feed_inner_timeline_reaction_link">
            <span>
              <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z"/>
              </svg>
              Share
            </span>
          </span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} currentUser={currentUser} isDark={isDark} />}

      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        target="post"
        targetId={post.id}
        count={post.likesCount}
      />

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Post">
        <p style={{ marginBottom: 20 }}>Are you sure you want to delete this post? This cannot be undone.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleteMutation.isPending}
            onClick={() => { deleteMutation.mutate(); setShowDeleteModal(false); }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
