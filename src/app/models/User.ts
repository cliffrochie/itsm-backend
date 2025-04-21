import mongoose, { Schema, Model } from 'mongoose'
import bcrypt from 'bcrypt'
import { IUser } from '../@types/IUser'
import { toUpper } from '../utils'



const UserSchema: Schema = new Schema<IUser>({
  avatar: { type: String, default: null },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, min: 6 },
  password: { type: String, required: true },
  firstName: { type: String, required: true, set: toUpper },
  middleName: { type: String, default: null, set: toUpper },
  lastName: { type: String, required: true, set: toUpper },
  extensionName: { type: String, default: null, set: toUpper },
  contactNo: { type: String, default: null },
  role: { type: String, default: 'user'},
  isActive: {type: Boolean, default: false },
  createdAt: { type: Date, immutable: true, default: () => Date.now() },
  updatedAt: { type: Date, default: null },
})

UserSchema.index({
  firstName: 1,
  middleName: 1,
  lastName: 1,
  extensionName: 1,
}, { unique: true })

UserSchema.pre<IUser>('save', async function(next: (error?: Error) => void) {
  try {
    if(!this.isModified('password')) return next()

    const hashedPassword = await bcrypt.hash(this.password, 10)
    this.password = hashedPassword
    this.updatedAt = new Date(Date.now())
    next()
  }
  catch(error: any) {
    console.error(`Error [User]: ${error}`)
    next(error)
  }
})

UserSchema.methods.comparePassword = function(password: string) {
  try {
    return bcrypt.compareSync(password, this.password)
  }
  catch(error) {
    return false
  }
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)

export default User