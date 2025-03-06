import mongoose, { Schema, Model } from 'mongoose'
import { INotification } from '../@types/INotification'


const NotificationSchema = new Schema<INotification>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  ticketNo: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, immutable: true, default: () => Date.now() },
  updatedAt: { type: Date, default: null },
})

NotificationSchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now())
  next()
})

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema)

export default Notification