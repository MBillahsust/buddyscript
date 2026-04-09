'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import type { LikersResponse, LikeTarget } from '@/types';

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: LikeTarget;
  targetId: string;
  count: number;
}

export function LikesModal({ isOpen, onClose, target, targetId, count }: LikesModalProps) {
  const path =
    target === 'post'
      ? `/posts/${targetId}/likes`
      : target === 'comment'
      ? `/comments/${targetId}/likes`
      : `/replies/${targetId}/likes`;

  const { data, isLoading } = useQuery<LikersResponse>({
    queryKey: ['likers', target, targetId],
    queryFn: async () => {
      const { data } = await api.get<{ data: LikersResponse }>(path);
      return data.data;
    },
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${count} Like${count !== 1 ? 's' : ''}`}>
      {isLoading ? (
        <p style={{ textAlign: 'center', padding: 16 }}>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {data?.likers.map(user => (
            <li
              key={user.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}
            >
              <Avatar
                avatarUrl={user.avatarUrl}
                firstName={user.firstName}
                lastName={user.lastName}
                size={36}
              />
              <span style={{ fontWeight: 500 }}>
                {user.firstName} {user.lastName}
              </span>
            </li>
          ))}
          {!data?.likers.length && (
            <p style={{ textAlign: 'center', color: '#888' }}>No likes yet</p>
          )}
        </ul>
      )}
    </Modal>
  );
}

// Hook + button component
interface LikeButtonProps {
  liked: boolean;
  count: number;
  loading: boolean;
  onToggle: () => void;
  target: LikeTarget;
  targetId: string;
  showLabel?: boolean;
}

export function LikeButton({
  liked,
  count,
  loading,
  onToggle,
  target,
  targetId,
  showLabel = false,
}: LikeButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        className={`_feed_inner_timeline_reaction_emoji _feed_reaction${liked ? ' _feed_reaction_active' : ''}`}
        onClick={onToggle}
        disabled={loading}
        style={showLabel ? {} : undefined}
      >
        <span className="_feed_inner_timeline_reaction_link">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {showLabel && ' Like'}
          </span>
        </span>
      </button>
      {count > 0 && (
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: '#666', padding: '0 4px',
          }}
        >
          {count}
        </button>
      )}
      <LikesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        target={target}
        targetId={targetId}
        count={count}
      />
    </>
  );
}
