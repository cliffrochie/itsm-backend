import { Document, Types } from 'mongoose'
import { IUser } from './IUser'
import { IClient } from './IClient'


export interface IServiceTicket extends Document {
  _id: Types.ObjectId
  ticketNo: string
  taskType: "incident" | "service request" | "maintenance"  | "consultation" | "accessibility"
  title: string
  natureOfWork: string
  serialNo?: string
  equipmentType: "computer" | "printer" | "mobile device" | "network related" | "software application" | "others"
  equipmentTypeOthers?: string
  defectsFound?: string
  serviceRendered?: string
  serviceStatus?: "" | "open" | "assigned" | "in progress" | "on hold" | "escalated" | "canceled" | "reopened" | "resolved" | "closed"
  isActive: boolean
  isFinished: boolean
  priority: "" | "low" | "medium" | "high"
  remarks?: string
  adminRemarks?: string
  rating?:  "" | "n" | "s" | "vs" | "d" | "vd"
  ratingComment?: string
  serviceEngineer?: Types.ObjectId | null
  client?: Types.ObjectId | null
  createdBy?: Types.ObjectId | null
  updatedBy?: Types.ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}

export interface IServiceTicketQueryParams {
  ticketNo?: string
  taskType?: string
  title?: string
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
  adminRemarks?: string
  rating?: "" | "n" | "s" | "vs" | "d" | "vd"
  ratingComment?: string
  sort?: string
  includes?: string
  page?: number
  limit?: number
  noPage?: boolean
  client?: string
  serviceEngineer?: string
  // Task Type
  totalIncident?: boolean
  totalServiceRequest?: boolean
  totalAssetRequest?: boolean
  totalMaintenance?: boolean
  totalConsultation?: boolean
  totalAccessibility?: boolean
  // Equipment Type
  totalComputer?: boolean
  totalPrinter?: boolean
  totalMobileDevice?: boolean
  totalNetworkRelated?: boolean
  totalSoftwareApplication?: boolean
  totalOthers?: boolean
  // Service Status
  totalTickets?: boolean
  totalOpenedTickets?: boolean
  totalAssignedTickets?: boolean
  totalInProgressTickets?: boolean
  totalOnHoldTickets?: boolean
  totalEscalatedTickets?: boolean
  totalCanceledTickets?: boolean
  totalReOpenedTickets?: boolean
  totalResolvedTickets?: boolean
  totalClosedTickets?: boolean
  
}

export interface IServiceTicketFilter {
  ticketNo?: object
  taskType?: object
  title?: object
  natureOfWork?: object
  serialNo?: object
  equipmentType?: object
  defectsFound?: object
  serviceRendered?: object
  serviceStatus?: object
  priority?: object
  remarks?: object
  adminRemarks?: object
  rating?: object
  ratingComment?: object
}

export interface IServiceTicketBody {
  ticketNo: string
  taskType: "incident" | "service request" | "maintenance"  | "consultation" | "accessibility"
  title: string
  natureOfWork: string
  serialNo?: string
  equipmentType: "computer" | "printer" | "mobile device" | "network related" | "software application" | "others"
  equipmentTypeOthers?: string
  defectsFound?: string
  serviceRendered?: string
  serviceStatus: "" | "open" | "assigned" | "in progress" | "on hold" | "escalated" | "canceled" | "reopened" | "resolved" | "closed"
  isActive: boolean
  isFinished: boolean
  priority: "" | "low" | "medium" | "high"
  remarks?: string
  adminRemarks?: string
  rating?: "" | "n" | "s" | "vs" | "d" | "vd"
  ratingComment?: string
  serviceEngineer?: string | null
  client?: string | null
  createdBy?: string
  updatedBy?: string
}


export interface IEscalatedTo {
  serviceEngineer: string
  serviceEngineerName: string
  adminRemarks?: string
  date?: string
  time?: string
}


export interface IUpdateServiceStatus {
  serviceStatus: string
  date?: string
  time?: string
}

export interface IServiceRating {
  serviceTicketId: Types.ObjectId
  rating: "" | "n" | "s" | "vs" | "d" | "vd"
  ratingComment: string
}


export interface IServiceTicketResults {
  results: IServiceTicket[]
  page: number
  totalPages: number
  total: number
}