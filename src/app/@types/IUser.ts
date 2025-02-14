import { Request } from 'express-serve-static-core'
import { Document } from 'mongoose'

export interface IUser extends Document {
  _id: string
  avatar?: string
  username: string
  email: string
  password: string
  firstName: string
  middleName?: string
  lastName: string
  extensionName?: string
  contactNo?: string
  role: "user" | "staff" | "admin" | "superadmin"
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
  comparePassword(password: string): boolean
}

export interface IUserQueryParams {
  firstName?: string
  middleName?: string
  lastName?: string
  extensionName?: string
  fullName?: string
  username?: string
  email?: string
  contactNo?: string
  role?: string
  isActive?: boolean
  personnel?: boolean
  exclude?: string
  sort?: string
  page?: number
  limit?: number
  noPage?: boolean
  total?: boolean
  totalSuperAdmin?: boolean
  totalAdmin?: boolean
  totalStaff?: boolean
  totalUser?: boolean
}

export interface IUserFilter {
  firstName?: object
  middleName?: object
  lastName?: object
  extensionName?: object
  username?: object
  email?: object
  contactNo?: object
  role?: object
  isActive?: object
  $or?: any
  $in?: any
  _id?: any
  personnel?: any
}

export interface IUserResults {
  results: IUser[]
  page: number
  totalPages: number
  total: number
}

export interface IUserSorter {
  username?: number
  firstName?: number
  middleName?: number
  lastName?: number
  extensionName?: number
  role?: number
  email?: number
}

export interface IUserRequest extends Request {
  userId?: string
  username?: string
  role?: string
}