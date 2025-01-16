import { Document, Types } from 'mongoose'


export interface IServiceTicketHistory extends Document {
  serviceTicket: Types.ObjectId
  serviceStatus: string
  date: Date
  time?: string
  action: string
  duration?: string
  remarks?: string
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface IServiceTicketHistoryQueryParams {
  serviceTicket?: string
  serviceStatus?: string
  date?: string
  time?: string
  action?: string
  duration?: string
  remarks?: string
  sort?: string
  page?: number
  limit?: number
  noPage?: boolean
}

export interface IServiceTicketHistoryFilter {
  serviceTicket?: object
  serviceStatus?: object
  date?: object
  time?: object
  action?: object
  duration?: object
  remarks?: object
}

export interface IServiceTicketHistoryBody {
  serviceTicket: string
  serviceStatus: string
  date: string
  time: string
  action: string
  duration?: string
  remarks?: string
  createdBy?: string
  updatedBy?: string
}

export interface IServiceTicketHistoryResults {
  results: IServiceTicketHistory[]
  page: number
  totalPages: number
  total: number
}
