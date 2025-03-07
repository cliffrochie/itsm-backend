import { Document, Types } from 'mongoose'
import { IUser } from './IUser'
import { Request } from 'express'

export interface INotification extends Document {
  user: Types.ObjectId
  serviceTicket: Types.ObjectId
  ticketNo: string
  message: string
  isRead: boolean
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}


export interface INotificationQueryParams {
  userId?: string
  serviceTicketId?: string
  ticketNo?: string
  message?: string
  isRead?: boolean
  page?: number
  sort?: string
  limit?: number
  noPage?: boolean
}


export interface INotificationFilter {
  user?: Types.ObjectId
  serviceTicket?: Types.ObjectId
  ticketNo?: object
  isRead?: boolean
}
