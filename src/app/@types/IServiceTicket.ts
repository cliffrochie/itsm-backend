import { Document, Types } from 'mongoose'
import { IUser } from './IUser'
import { IClient } from './IClient'


export interface IServiceTicket extends Document {
  ticketNo: string
  date: Date
  time?: string
  taskType: "incident" | "service request" | "problem" | "maintenance" | "training" | "consultation"
  natureOfWork: string
  serialNo?: string
  equipmentType: "computer" | "software application" | "printer" | "phone" | "network" | "others"
  equipmentTypeOthers?: string
  defectsFound?: string
  serviceRendered?: string
  serviceStatus?: "open" | "in progress" | "on hold" | "escalated" | "canceled" | "reopened" | "resolved" | "closed"
  isActive: boolean
  isFinished: boolean
  priority: "low" | "medium" | "high"
  remarks?: string
  serviceEngineer?: Types.ObjectId
  client?: Types.ObjectId
  createdBy?: Types.ObjectId
  updatedBy?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface IServiceTicketQueryParams {
  ticketNo?: string
  date?: string
  time?: string
  taskType?: string
  natureOfWork?: string
  serialNo?: string
  equipmentType?: string
  equipmentTypeOthers?: string
  defectsFound?: string
  serviceRendered?: string
  serviceStatus?: string
  isActive?: boolean
  isFinished?: boolean
  priority?: string
  remarks?: string
  sort?: string
  page?: number
  limit?: number
  noPage?: boolean
}

export interface IServiceTicketFilter {
  ticketNo?: object
  date?: object
  time?: object
  taskType?: object
  natureOfWork?: object
  serialNo?: object
  equipmentType?: object
  defectsFound?: object
  serviceRendered?: object
  serviceStatus?: object
  isActive?: object
  isFinished?: object
  priority?: object
  remarks?: object
}

export interface IServiceTicketBody {
  ticketNo: string
  date: string
  time?: string
  taskType?: "incident" | "service request" | "problem" | "maintenance" | "training" | "consultation"
  natureOfWork: string
  serialNo?: string
  equipmentType: "computer" | "software application" | "printer" | "phone" | "network" | "others"
  equipmentTypeOthers?: string
  defectsFound?: string
  serviceRendered?: string
  serviceStatus: "open" | "in progress" | "on hold" | "escalated" | "canceled" | "reopened" | "resolved" | "closed"
  isActive: boolean
  isFinished: boolean
  priority: "low" | "medium" | "high"
  remarks?: string
  serviceEngineerId?: string
  clientId?: string
  createdById?: string
  updatedById?: string
}

export interface IServiceTicketResults {
  results: IServiceTicket[]
  page: number
  totalPages: number
  total: number
}