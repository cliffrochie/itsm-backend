import { Request } from 'express-serve-static-core'
import { Document, Types } from 'mongoose'

export interface IActionLog extends Document {
  url: string
  method: string
  statusCode: number
  userId?: string
  ip?: string
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  params?: Record<string, unknown>
  timestamp: Date
}