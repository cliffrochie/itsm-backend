import { Document, Types } from 'mongoose'
import { IUser } from './IUser'

export interface IDesignation extends Document {
  title?: string
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface IDesignationQueryParams {
  title?: string
  sort?: string
  page?: number
  limit?: number
  noPage?: boolean
}

export interface IDesignationFilter {
  title?: object
}

export interface IDesignationBody {
  title?: string
  createdById?: string
  updatedById?: string
}

export interface IDesignationResults {
  results: IDesignation[]
  page: number
  totalPages: number
  total: number
}