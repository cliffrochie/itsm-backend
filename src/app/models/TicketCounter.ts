import mongoose, { Schema, Model } from "mongoose";
import { ITicketCounter } from "../@types/ITicketCounter";

const TicketCounterSchema = new Schema<ITicketCounter>({
  year: { type: String, unique: true },
  counter: { type: Number },
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

TicketCounterSchema.pre("save", async function (next) {
  this.updatedAt = new Date(Date.now());
  next();
});

const TicketCounter: Model<ITicketCounter> = mongoose.model<ITicketCounter>(
  "TicketCounter",
  TicketCounterSchema
);

export default TicketCounter;
