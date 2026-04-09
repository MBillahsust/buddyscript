import { CSSProperties } from 'react';

interface AvatarProps {
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const COLORS = [
  '#1890FF', '#0ACF83', '#FF4D4F', '#FAAD14', '#722ED1',
  '#13C2C2', '#FA541C', '#2F54EB',
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ avatarUrl, firstName, lastName, size = 40, className = '', style = {} }: AvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const bg = getColor(firstName + lastName);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: '50%', objectFit: 'cover', width: size, height: size, ...style }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.4,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
