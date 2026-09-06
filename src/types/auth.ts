import type { Request } from "express";

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "service_engineer" | "staff" | "user";
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  /** Raw bearer token for the current request, set by `authenticate`. */
  token?: string;
}
