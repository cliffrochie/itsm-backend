import { Document, Types } from 'mongoose'


export interface IServiceTicketHistory extends Document {
  serviceTicket: Types.ObjectId
  date: string
  time?: string
  details: string  
  remarks?: string
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface IServiceTicketHistoryQueryParams {
  serviceTicket?: string
  date?: string
  time?: string
  details?: string  
  remarks?: string
  sort?: string
  page?: number
  limit?: number
  noPage?: boolean
}

export interface IServiceTicketHistoryFilter {
  serviceTicket?: object | Types.ObjectId
  date?: object
  time?: object
  details?: object  
  remarks?: object
}

export interface IServiceTicketHistoryBody {
  serviceTicket: string
  date: string
  time: string
  details: string
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
