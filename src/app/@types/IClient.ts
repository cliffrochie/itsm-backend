import { Document, Types } from 'mongoose'
import { IUser } from './IUser'
import { IDesignation } from './IDesignation'
import { IOffice } from './IOffice'


export interface IClient extends Document {
  user?: Types.ObjectId
  firstName: string
  middleName?: string
  lastName: string
  extensionName?: string
  contactNo?: string,
  email?: string,
  designation?: Types.ObjectId
  office?: Types.ObjectId
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface IClientQueryParams {
  user?: string
  firstName?: string
  middleName?: string
  lastName?: string
  extensionName?: string
  sort?: string
  page?: number
  limit?: number
  includes?: string
  noPage?: boolean
}

export interface IClientFilter {
  firstName?: object
  middleName?: object
  lastName?: object
  extensionName?: object
}

export interface IClientBody {
  user?: string
  firstName: string
  middleName?: string
  lastName: string
  extensionName?: string
  contactNo?: string,
  email?: string,
  designation?: string
  office?: string
  createdBy?: string
  updatedBy?: string
}

export interface IClientResults {
  results: IClient[]
  page: number
  totalPages: number
  total: number
}
