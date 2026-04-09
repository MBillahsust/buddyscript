import type { CSSProperties } from "react"

type UserAvatarProps = {
  avatarUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  size?: number
  className?: string
  style?: CSSProperties
  alt?: string
}

const COLORS = [
  "#2F80ED",
  "#1E88E5",
  "#3F8CFF",
  "#F2A900",
  "#F4B400",
  "#22A6B3",
  "#4A90E2",
  "#2D9CDB",
]

function resolveName(firstName?: string | null, lastName?: string | null, name?: string | null) {
  const f = (firstName ?? "").trim()
  const l = (lastName ?? "").trim()
  const fullFromParts = `${f} ${l}`.trim()
  const full = (fullFromParts || (name ?? "").trim())
  if (!full) return { first: "", last: "", full: "User" }

  const parts = full.split(/\s+/)
  const first = parts[0] ?? ""
  const last = parts.length > 1 ? parts[1] : ""
  return {
    first,
    last,
    full,
  }
}

function pickColor(seed: string) {
  const normalized = seed.trim().toLowerCase()
  let hash = 0
  for (let i = 0; i < normalized.length; i += 1) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function UserAvatar({
  avatarUrl,
  firstName,
  lastName,
  name,
  size = 40,
  className,
  style,
  alt,
}: UserAvatarProps) {
  const resolved = resolveName(firstName, lastName, name)
  const initials = `${resolved.first.charAt(0)}${resolved.last.charAt(0)}`.toUpperCase() || resolved.full.charAt(0).toUpperCase() || "U"
  const colorSeed = initials || resolved.full

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt ?? resolved.full}
        className={className}
        style={{ borderRadius: "50%", objectFit: "cover", width: size, height: size, ...style }}
      />
    )
  }

  return (
    <div
      className={className}
      aria-label={alt ?? resolved.full}
      title={resolved.full}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        color: "#fff",
        background: pickColor(colorSeed),
        userSelect: "none",
        textTransform: "uppercase",
        fontSize: size * 0.4,
        flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  )
}
