import mongoose, { Schema, Model } from 'mongoose'
import { IServiceTicketHistory } from '../@types/IServiceTicketHistory'


const ServiceTicketHistorySchema = new Schema<IServiceTicketHistory>({
  serviceTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceTicket' },
  date: { type: String, required: true, match: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/([0-9]{4})$/ },
  time: { type: String, default: null, match: /^(0[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$/ },
  details: { type: String, requried: true },
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