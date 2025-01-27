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
  personnel?: boolean
  sort?: string
  page?: number
  limit?: number
  noPage?: boolean
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
  $or?: any
  $in?: any
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

export interface IUserIdRequest extends Request {
  userId?: string
}