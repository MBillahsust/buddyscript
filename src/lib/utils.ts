import { formatDistanceToNow } from "date-fns"

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}
