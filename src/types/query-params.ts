export interface JwtPayload {
  userId?: string
  username?: string
  role?: "user" | "staff" | "admin" | "superadmin"
}