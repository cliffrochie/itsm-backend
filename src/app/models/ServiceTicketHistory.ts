import mongoose, { Schema, Model } from 'mongoose'
import { IServiceTicketHistory } from '../@types/IServiceTicketHistory'


const ServiceTicketHistorySchema = new Schema<IServiceTicketHistory>({
  serviceTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceTicket' },
  serviceStatus: { type: String, required: true },
  date: { type: Date, immutable: true, default: () => Date.now() },
  time: { type: String },
  action: { type: String, required: true },
  duration: { type: String },
  remarks: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, immutable: true, default: () => Date.now() },
  updatedAt: { type: Date, default: null },
})

ServiceTicketHistorySchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now())
  next()
})

const ServiceTicketHistory: Model<IServiceTicketHistory> = mongoose.model<IServiceTicketHistory>('ServiceTicketHistory', ServiceTicketHistorySchema)

export default ServiceTicketHistory