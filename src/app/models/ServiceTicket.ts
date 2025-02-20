import mongoose, { Schema, Model } from 'mongoose'
import { IServiceTicket } from '../@types/IServiceTicket'


const ServiceTicketSchema = new Schema<IServiceTicket>({
  ticketNo: { type: String, required: true, unique: true },
  taskType: { type: String, default: null },
  title: { type: String, default: null },
  natureOfWork: { type: String, default: null },
  serialNo: { type: String, default: null },
  equipmentType: { type: String, default: null },
  equipmentTypeOthers: { type: String, default: null },
  defectsFound: { type: String, default: null },
  serviceRendered: { type: String, default: null },
  serviceStatus: { type: String, required: true, default: "open" },
  priority: { type: String, default: "low" },
  remarks: { type: String, default: null },
  adminRemarks: { type: String, default: null },
  serviceEngineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, immutable: true, default: () => Date.now() },
  updatedAt: { type: Date, default: null },
})

ServiceTicketSchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now())
  next()
})

const ServiceTicket: Model<IServiceTicket> = mongoose.model<IServiceTicket>('ServiceTicket', ServiceTicketSchema)

export default ServiceTicket