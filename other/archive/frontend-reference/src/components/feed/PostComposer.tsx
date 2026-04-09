'use client';

import { useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useCreatePost } from '@/hooks/useCreatePost';
import type { User } from '@/types';

interface PostComposerProps {
  currentUser: User;
  isDark?: boolean;
}

export function PostComposer({ currentUser, isDark = false }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const createPost = useCreatePost();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if ((!text && !imageUrl) || createPost.isPending) return;

    await createPost.mutateAsync({
      content: text,
      ...(imageUrl ? { imageUrl } : {}),
      visibility,
    });
    setContent('');
    setImageUrl(null);
    setImagePreview(null);
    setVisibility('PUBLIC');
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleImageClear = () => {
    setImageUrl(null);
    setImagePreview(null);
  };

  return (
    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      <form onSubmit={handleSubmit}>
        <div className="_feed_inner_text_area_box">
          <div className="_feed_inner_text_area_box_image">
            <Avatar
              avatarUrl={currentUser.avatarUrl}
              firstName={currentUser.firstName}
              lastName={currentUser.lastName}
              size={44}
              className="_txt_img"
            />
          </div>
          <div className="form-floating _feed_inner_text_area_box_form" style={{ flex: 1, position: 'relative' }}>
            <textarea
              className="form-control _textarea"
              placeholder="Leave a comment here"
              id="postTextarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              maxLength={5000}
              rows={3}
              style={{
                border: isDark ? '1px solid #444' : '1px solid #e0e0e0',
                backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
                color: isDark ? '#fff' : '#000',
                borderRadius: 8,
                fontSize: 'clamp(13px, 2vw, 15px)',
              }}
            />
            {!content && (
              <label className="_feed_textarea_label" htmlFor="postTextarea" style={{
                position: 'absolute',
                left: 12,
                top: 12,
                color: isDark ? '#aaa' : '#999',
                fontSize: 'clamp(12px, 2vw, 13px)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                pointerEvents: 'none',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 23 24">
                  <path fill={isDark ? '#aaa' : '#999'} d="M19.504 19.209c.332 0 .601.289.601.646 0 .326-.226.596-.52.64l-.081.005h-6.276c-.332 0-.602-.289-.602-.645 0-.327.227-.597.52-.64l.082-.006h6.276zM13.4 4.417c1.139-1.223 2.986-1.223 4.125 0l1.182 1.268c1.14 1.223 1.14 3.205 0 4.427L9.82 19.649a2.619 2.619 0 01-1.916.85h-3.64c-.337 0-.61-.298-.6-.66l.09-3.941a3.019 3.019 0 01.794-1.982l8.852-9.5zm-.688 2.562l-7.313 7.85a1.68 1.68 0 00-.441 1.101l-.077 3.278h3.023c.356 0 .698-.133.968-.376l.098-.096 7.35-7.887-3.608-3.87zm3.962-1.65a1.633 1.633 0 00-2.423 0l-.688.737 3.606 3.87.688-.737c.631-.678.666-1.755.105-2.477l-.105-.124-1.183-1.268z" />
                </svg>
                Write something ...
              </label>
            )}
          </div>
        </div>

        <div className="_feed_inner_text_area_bottom" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 3vw, 16px)', padding: 'clamp(12px, 2vw, 16px) 0', marginTop: 'clamp(12px, 2vw, 16px)' }}>
          {/* Left: Attachment Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 8px)' }}>
            {/* Photo Upload */}
            <div className="_feed_inner_text_area_bottom_photo">
              <ImageUpload
                onUpload={handleImageUpload}
                onClear={handleImageClear}
                preview={imagePreview}
              />
            </div>

            {/* Video Button - Icon Only */}
            <button
              type="button"
              className="_feed_toolbar_icon_btn"
              title="Add video"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'clamp(6px, 1.5vw, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                transition: 'background-color 0.2s',
                color: isDark ? '#ccc' : '#666',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = '#f0f2f5';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = 'transparent';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 22 24">
                <path fill="currentColor" d="M11.485 4.5c2.213 0 3.753 1.534 3.917 3.784l2.418-1.082c1.047-.468 2.188.327 2.271 1.533l.005.141v6.64c0 1.237-1.103 2.093-2.155 1.72l-.121-.047-2.418-1.083c-.164 2.25-1.708 3.785-3.917 3.785H5.76c-2.343 0-3.932-1.72-3.932-4.188V8.688c0-2.47 1.589-4.188 3.932-4.188h5.726zm0 1.5H5.76C4.169 6 3.197 7.05 3.197 8.688v7.015c0 1.636.972 2.688 2.562 2.688h5.726c1.586 0 2.562-1.054 2.562-2.688v-.686-6.329c0-1.636-.973-2.688-2.562-2.688zM18.4 8.57l-.062.02-2.921 1.306v4.596l2.921 1.307c.165.073.343-.036.38-.215l.008-.07V8.876c0-.195-.16-.334-.326-.305z"/>
              </svg>
              <span style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '11px', whiteSpace: 'nowrap', opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }} className="_tooltip">Video</span>
            </button>

            {/* Event Button - Icon Only */}
            <button
              type="button"
              className="_feed_toolbar_icon_btn"
              title="Add event"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'clamp(6px, 1.5vw, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                transition: 'background-color 0.2s',
                color: isDark ? '#ccc' : '#666',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = '#f0f2f5';
                const tooltip = el.querySelector('._tooltip') as HTMLElement;
                if (tooltip) tooltip.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = 'transparent';
                const tooltip = el.querySelector('._tooltip') as HTMLElement;
                if (tooltip) tooltip.style.opacity = '0';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 22 24">
                <path fill="currentColor" d="M14.371 2c.32 0 .585.262.627.603l.005.095v.788c2.598.195 4.188 2.033 4.18 5v8.488c0 3.145-1.786 5.026-4.656 5.026H7.395C4.53 22 2.74 20.087 2.74 16.904V8.486c0-2.966 1.596-4.804 4.187-5v-.788c0-.386.283-.698.633-.698.32 0 .584.262.626.603l.006.095v.771h5.546v-.771c0-.386.284-.698.633-.698zm3.546 8.283H4.004l.001 6.621c0 2.325 1.137 3.616 3.183 3.697l.207.004h7.132c2.184 0 3.39-1.271 3.39-3.63v-6.692zm-3.202 5.853c.349 0 .632.312.632.698 0 .353-.238.645-.546.691l-.086.006c-.357 0-.64-.312-.64-.697 0-.354.237-.645.546-.692l.094-.006zm-3.742 0c.35 0 .632.312.632.698 0 .353-.238.645-.546.691l-.086.006c-.357 0-.64-.312-.64-.697 0-.354.238-.645.546-.692l.094-.006zm-3.75 0c.35 0 .633.312.633.698 0 .353-.238.645-.547.691l-.093.006c-.35 0-.633-.312-.633-.697 0-.354.238-.645.547-.692l.094-.006zm7.492-3.615c.349 0 .632.312.632.697 0 .354-.238.645-.546.692l-.086.006c-.357 0-.64-.312-.64-.698 0-.353.237-.645.546-.691l.094-.006zm-3.742 0c.35 0 .632.312.632.697 0 .354-.238.645-.546.692l-.086.006c-.357 0-.64-.312-.64-.698 0-.353.238-.645.546-.691l.094-.006zm-3.75 0c.35 0 .633.312.633.697 0 .354-.238.645-.547.692l-.093.006c-.35 0-.633-.312-.633-.698 0-.353.238-.645.547-.691l.094-.006zm6.515-7.657H8.192v.895c0 .385-.283.698-.633.698-.32 0-.584-.263-.626-.603l-.006-.095v-.874c-1.886.173-2.922 1.422-2.922 3.6v.402h13.912v-.403c.007-2.181-1.024-3.427-2.914-3.599v.874c0 .385-.283.698-.632.698-.32 0-.585-.263-.627-.603l-.005-.095v-.895z"/>
              </svg>
              <span style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '11px', whiteSpace: 'nowrap', opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }} className="_tooltip">Event</span>
            </button>

            {/* Article Button - Icon Only */}
            <button
              type="button"
              className="_feed_toolbar_icon_btn"
              title="Add article"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'clamp(6px, 1.5vw, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                transition: 'background-color 0.2s',
                color: isDark ? '#ccc' : '#666',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = '#f0f2f5';
                const tooltip = el.querySelector('._tooltip') as HTMLElement;
                if (tooltip) tooltip.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = 'transparent';
                const tooltip = el.querySelector('._tooltip') as HTMLElement;
                if (tooltip) tooltip.style.opacity = '0';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 20">
                <path fill="currentColor" d="M12.49 0c2.92 0 4.665 1.92 4.693 5.132v9.659c0 3.257-1.75 5.209-4.693 5.209H5.434c-.377 0-.734-.032-1.07-.095l-.2-.041C2 19.371.74 17.555.74 14.791V5.209c0-.334.019-.654.055-.96C1.114 1.564 2.799 0 5.434 0h7.056zm-.008 1.457H5.434c-2.244 0-3.381 1.263-3.381 3.752v9.582c0 2.489 1.137 3.752 3.38 3.752h7.049c2.242 0 3.372-1.263 3.372-3.752V5.209c0-2.489-1.13-3.752-3.372-3.752zm-.239 12.053c.36 0 .652.324.652.724 0 .4-.292.724-.652.724H5.656c-.36 0-.652-.324-.652-.724 0-.4.293-.724.652-.724h6.587zm0-4.239a.643.643 0 01.632.339.806.806 0 010 .78.643.643 0 01-.632.339H5.656c-.334-.042-.587-.355-.587-.729s.253-.688.587-.729h6.587zM8.17 5.042c.335.041.588.355.588.729 0 .373-.253.687-.588.728H5.665c-.336-.041-.589-.355-.589-.728 0-.374.253-.688.589-.729H8.17z"/>
              </svg>
              <span style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '11px', whiteSpace: 'nowrap', opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }} className="_tooltip">Article</span>
            </button>
          </div>

          {/* Spacer - pushes right buttons to the right */}
          <div style={{ flex: 1 }} />

          {/* Right: Privacy & Post Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 10px)' }}>
            {/* Privacy Button - Outline Pill Style */}
            <button
              type="button"
              onClick={() => setVisibility(v => v === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
              className="_feed_privacy_btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(4px, 1vw, 6px)',
                padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 14px)',
                borderRadius: 20,
                background: 'transparent',
                border: isDark ? '1px solid #555' : '1px solid #d9d9d9',
                color: isDark ? '#ccc' : '#666',
                fontSize: 'clamp(11px, 1.5vw, 12px)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = '#1890FF';
                el.style.backgroundColor = isDark ? '#1a3a52' : '#f5f9ff';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = isDark ? '#555' : '#d9d9d9';
                el.style.backgroundColor = 'transparent';
              }}
            >
              {visibility === 'PUBLIC' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Public
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Private
                </>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {/* Post Button - Primary CTA */}
            <button
              type="submit"
              className="_feed_inner_text_area_btn_link"
              disabled={createPost.isPending || (!content.trim() && !imageUrl)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(4px, 1vw, 6px)',
                padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                background: createPost.isPending || (!content.trim() && !imageUrl) ? '#bfbfbf' : '#1890FF',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 'clamp(12px, 1.5vw, 13px)',
                fontWeight: 600,
                cursor: createPost.isPending || (!content.trim() && !imageUrl) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!createPost.isPending && (content.trim() || imageUrl)) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = '#1764be';
                }
              }}
              onMouseLeave={(e) => {
                if (!createPost.isPending && (content.trim() || imageUrl)) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = '#1890FF';
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="12" fill="none" viewBox="0 0 14 13">
                <path fill="currentColor" fillRule="evenodd" d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88zM9.097 13c-.464 0-.89-.236-1.14-.641L5.372 8.165l-4.237-2.65a1.336 1.336 0 01-.622-1.331c.074-.536.441-.96.957-1.112L11.774.054a1.347 1.347 0 011.67 1.682l-3.05 10.296A1.332 1.332 0 019.098 13z" clipRule="evenodd" />
              </svg>
              <span>{createPost.isPending ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
