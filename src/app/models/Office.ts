import mongoose, { Schema, Model } from "mongoose";
import { IOffice } from "../@types/IOffice";

const OfficeSchema = new Schema<IOffice>({
  name: { type: String, required: true, unique: true },
  alias: { type: String, required: true, unique: true },
  officeType: { type: String, default: null },
  parentOffice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Office",
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: { type: Date, immutable: true, default: () => Date.now() },
  updatedAt: { type: Date, default: null },
});

OfficeSchema.pre("save", async function (next) {
  this.updatedAt = new Date(Date.now());
  next();
});

const Office: Model<IOffice> = mongoose.model<IOffice>("Office", OfficeSchema);

export default Office;
