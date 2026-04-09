'use client';

import { useEffect, useRef } from 'react';
import { PostCard } from './PostCard';
import { useInfinitePosts } from '@/hooks/useInfinitePosts';
import type { User } from '@/types';

interface PostListProps {
  currentUser: User;
  isDark?: boolean;
}

export function PostList({ currentUser, isDark = false }: PostListProps) {
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useInfinitePosts();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError) {
    return (
      <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16"
        style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: isDark ? '#aaa' : '#888', fontSize: 16, marginBottom: 16 }}>Failed to load posts.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16"
            style={{ minHeight: 120, opacity: 0.5 }}
          >
            <div style={{ padding: '0 24px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e8e8e8' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#e8e8e8', borderRadius: 4, width: '40%', marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#e8e8e8', borderRadius: 4, width: '25%' }} />
                </div>
              </div>
              <div style={{ height: 60, background: '#e8e8e8', borderRadius: 4, marginTop: 16 }} />
            </div>
          </div>
        ))}
      </>
    );
  }

  const posts = data?.pages.flatMap(p => p.posts) ?? [];

  if (posts.length === 0) {
    return (
      <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16"
        style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: isDark ? '#aaa' : '#888', fontSize: 16 }}>Be the first to post something!</p>
      </div>
    );
  }

  return (
    <>
      {posts.map(post => (
        <PostCard key={post.id} post={post} currentUser={currentUser} isDark={isDark} />
      ))}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {isFetchingNextPage && (
        <p style={{ textAlign: 'center', padding: 16, color: '#888' }}>Loading more...</p>
      )}
    </>
  );
}
