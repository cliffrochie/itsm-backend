import { canViewUserContactDetails } from "../authorization/user.authorization";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Shapes a user for the wire. Never hand a raw row to a client: `email` and
 * `contactNo` are only included for viewers entitled to see them, so listing
 * users cannot be used to harvest contact details.
 */
export interface PublicUser {
  id: number;
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  extensionName: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  email?: string;
  contactNo?: string | null;
}

type UserRow = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  extensionName: string | null;
  contactNo: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export function mapUserResponse(user: UserRow, viewer: AuthenticatedUser): PublicUser {
  const shaped: PublicUser = {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    extensionName: user.extensionName,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (canViewUserContactDetails(viewer, user.id)) {
    shaped.email = user.email;
    shaped.contactNo = user.contactNo;
  }

  return shaped;
}

export function mapUserListResponse(rows: UserRow[], viewer: AuthenticatedUser): PublicUser[] {
  return rows.map((row) => mapUserResponse(row, viewer));
}
