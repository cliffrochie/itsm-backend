import mongoose, { Schema, Model } from 'mongoose'
import { IClient } from '../@types/IClient'


const ClientSchema = new Schema<IClient>({
  firstName: { type: String, required: true },
  middleName: { type: String, default: null },
  lastName: { type: String, required: true },
  extensionName: { type: String, default: null },
  designation: { type: mongoose.Schema.ObjectId, ref: 'Designation', default: null }, 
  office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, immutable: true, default: () => Date.now() },
  updatedAt: { type: Date, default: null},
})

ClientSchema.pre('save', async function(next) {
  this.updatedAt = new Date(Date.now())
  next()
})

const Client: Model<IClient> = mongoose.model<IClient>('Client', ClientSchema)

export default Client