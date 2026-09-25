/** Post-login landing path by `users.role`. Always send users here so middleware does not have to bounce `/dashboard`. */
export function homePathForRole(role: string | null | undefined): string {
  if (role === "admin") return "/admin"
  if (role === "provider") return "/dashboard/queue"
  return "/my-queue"
}
