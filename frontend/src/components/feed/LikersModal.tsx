"use client"

import { useQuery } from "@tanstack/react-query"
import { UserAvatar } from "@/components/ui/UserAvatar"

type Liker = {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

type LikersModalProps = {
  open: boolean
  onClose: () => void
  title: string
  queryKey: string[]
  endpoint: string
}

async function fetchLikers(endpoint: string): Promise<{ likers: Liker[]; total: number }> {
  const response = await fetch(endpoint)
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error ?? "Failed to load likers")
  }
  return response.json()
}

export function LikersModal({ open, onClose, title, queryKey, endpoint }: LikersModalProps) {
  const { data, isPending, isError } = useQuery({
    queryKey,
    queryFn: () => fetchLikers(endpoint),
    enabled: open,
  })

  if (!open) return null

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.45)" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ borderRadius: 18, overflow: "hidden" }}>
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <div className="modal-body" style={{ maxHeight: 420, overflowY: "auto" }}>
            {isPending && <p style={{ marginBottom: 0 }}>Loading...</p>}
            {isError && <p style={{ marginBottom: 0, color: "#dc3545" }}>Failed to load.</p>}
            {!isPending && !isError && (!data?.likers?.length ? (
              <p style={{ marginBottom: 0, color: "#666" }}>No likes yet.</p>
            ) : (
              <div className="d-grid gap-3">
                {data?.likers.map((liker) => (
                  <div className="d-flex align-items-center gap-3" key={liker.id}>
                    <UserAvatar
                      avatarUrl={liker.avatarUrl}
                      firstName={liker.firstName}
                      lastName={liker.lastName}
                      alt={`${liker.firstName} ${liker.lastName}`}
                      style={{ width: 44, height: 44, fontSize: 16 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{liker.firstName} {liker.lastName}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
