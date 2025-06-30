import mongoose, { Schema, Model } from "mongoose";
import { IDesignation } from "../@types/IDesignation";

const DesignationSchema: Schema = new Schema<IDesignation>({
  title: { type: String, required: true, unique: true },
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

DesignationSchema.pre("save", async function (next) {
  this.updatedAt = new Date(Date.now());
  next();
});

const Designation: Model<IDesignation> = mongoose.model<IDesignation>(
  "Designation",
  DesignationSchema
);

export default Designation;
