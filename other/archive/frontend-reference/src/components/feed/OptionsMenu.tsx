'use client';

import { useState, useRef, useEffect } from 'react';

interface OptionsMenuProps {
  onDelete: () => void;
  deleting: boolean;
}

export function OptionsMenu({ onDelete, deleting }: OptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          color: '#999',
          fontSize: 16,
          lineHeight: 1,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#555')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
        title="More options"
      >
        ···
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            backgroundColor: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            minWidth: 140,
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            disabled={deleting}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontSize: 13,
              color: '#cf1322',
              fontWeight: 500,
              transition: 'background-color 0.2s ease',
              opacity: deleting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !deleting && (e.currentTarget.style.backgroundColor = '#fff1f0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
