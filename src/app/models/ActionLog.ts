import mongoose, { Schema, Model } from 'mongoose'
import { IActionLog } from '../@types/IActionLog'


const ActionLogSchema: Schema = new Schema<IActionLog>({
  url: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true},
  userId: { type: String },
  ip: { type: String },
  body: { type: Schema.Types.Mixed },
  query: { type: Schema.Types.Mixed },
  params: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: () => Date.now() },
})

const ActionLog = mongoose.model<IActionLog>('ActionLog', ActionLogSchema)

export default ActionLog