'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    onClose();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 'clamp(200px, 60vw, 280px)',
          height: '100vh',
          background: 'var(--bg2)',
          zIndex: 999,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
          paddingTop: '70px', /* Account for navbar height */
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', padding: 'clamp(12px, 3vw, 16px)' }}>
          {/* Navigation Links */}
          <Link
            href="/feed"
            style={{
              display: 'block',
              padding: 'clamp(10px, 2vw, 14px)',
              color: '#333',
              textDecoration: 'none',
              fontSize: 'clamp(13px, 2vw, 15px)',
              fontWeight: 500,
              borderRadius: 6,
              marginBottom: 8,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            className="_mobile_sidebar_link"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '#f0f2f5';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'transparent';
            }}
            onClick={onClose}
          >
            📰 Feed
          </Link>

          <div
            style={{
              display: 'block',
              padding: 'clamp(10px, 2vw, 14px)',
              color: '#333',
              fontSize: 'clamp(13px, 2vw, 15px)',
              fontWeight: 500,
              borderRadius: 6,
              marginBottom: 8,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            className="_mobile_sidebar_link"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '#f0f2f5';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'transparent';
            }}
            onClick={onClose}
          >
            👤 Profile
          </div>

          <div
            style={{
              display: 'block',
              padding: 'clamp(10px, 2vw, 14px)',
              color: '#333',
              fontSize: 'clamp(13px, 2vw, 15px)',
              fontWeight: 500,
              borderRadius: 6,
              marginBottom: 8,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            className="_mobile_sidebar_link"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '#f0f2f5';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'transparent';
            }}
            onClick={onClose}
          >
            ⚙️ Settings
          </div>

          <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'block',
              width: '100%',
              padding: 'clamp(10px, 2vw, 14px)',
              textAlign: 'left',
              color: '#d32f2f',
              fontSize: 'clamp(13px, 2vw, 15px)',
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            className="_mobile_sidebar_link_logout"
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = '#ffebee';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'transparent';
            }}
          >
            <span>🚪 Logout</span>
          </button>
        </nav>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 998,
          }}
          onClick={onClose}
        />
      )}
    </>
  );
}
