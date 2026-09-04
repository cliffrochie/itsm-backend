import type { Request } from "express";

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "service_engineer" | "staff" | "user";
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}
