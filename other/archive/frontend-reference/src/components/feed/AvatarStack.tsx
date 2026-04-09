'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { LikeUser } from '@/types';

interface AvatarStackProps {
  likers: LikeUser[];
  totalCount: number;
  maxVisible?: number;
  onViewAll?: () => void;
  isDark?: boolean;
}

export function AvatarStack({
  likers,
  totalCount,
  maxVisible = 3,
  onViewAll,
  isDark = false,
}: AvatarStackProps) {
  const [overlapPx, setOverlapPx] = useState(20);

  // Calculate responsive overlap based on viewport width
  useEffect(() => {
    const calculateOverlap = () => {
      if (typeof window === 'undefined') return;
      // Desktop: 20px, Tablet: 16px, Mobile: 12px
      const width = window.innerWidth;
      setOverlapPx(width >= 1024 ? 20 : width >= 768 ? 16 : 12);
    };

    calculateOverlap();
    window.addEventListener('resize', calculateOverlap);
    return () => window.removeEventListener('resize', calculateOverlap);
  }, []);

  if (totalCount === 0) return null;

  const visibleLikers = likers.slice(0, maxVisible);
  const remainder = totalCount - visibleLikers.length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(6px, 2vw, 8px)',
        cursor: onViewAll ? 'pointer' : 'default',
        position: 'relative',
        zIndex: 'auto',
      }}
      onClick={onViewAll}
    >
      {/* Avatar Stack Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          height: 'clamp(24px, 5vw, 32px)',
          cursor: onViewAll ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onViewAll?.();
        }}
      >
        {visibleLikers.map((liker, index) => (
          <div
            key={liker.id}
            style={{
              position: 'absolute',
              left: `${index * overlapPx}px`,
              zIndex: visibleLikers.length - index,
            }}
          >
            <Avatar
              avatarUrl={liker.avatarUrl}
              firstName={liker.firstName}
              lastName={liker.lastName}
              size={32}
              style={{
                border: '2px solid white',
                boxShadow: '0 0 0 1px #e0e0e0',
              }}
            />
          </div>
        ))}

        {/* Remainder Badge */}
        {remainder > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${visibleLikers.length * overlapPx}px`,
              width: 'clamp(24px, 5vw, 32px)',
              height: 'clamp(24px, 5vw, 32px)',
              borderRadius: '50%',
              backgroundColor: '#1890FF',
              border: '2px solid white',
              boxShadow: '0 0 0 1px #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 'clamp(9px, 2vw, 11px)',
              fontWeight: 'bold',
              zIndex: 0,
              cursor: onViewAll ? 'pointer' : 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onViewAll?.();
            }}
            role={onViewAll ? 'button' : undefined}
            tabIndex={onViewAll ? 0 : undefined}
          >
            +{remainder}
          </div>
        )}
      </div>

      {/* Like Count Text */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewAll?.();
        }}
        className="_secondary_text_btn"
        style={{
          background: 'none',
          border: 'none',
          cursor: onViewAll ? 'pointer' : 'default',
          color: isDark ? '#aaa' : '#666',
          fontSize: 'clamp(12px, 2vw, 13px)',
          padding: 0,
          fontWeight: 500,
        }}
      >
        {totalCount} like{totalCount !== 1 ? 's' : ''}
      </button>
    </div>
  );
}
