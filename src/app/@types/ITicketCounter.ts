import { Document, Types } from "mongoose";

export interface ITicketCounter extends Document {
  year: string;
  counter: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITicketCounterQueryParams {
  year?: string;
  counter?: string;
  sort?: string;
  page?: number;
  limit?: number;
  noPage?: boolean;
}

export interface ITicketCounterFilter {
  year?: object;
  counter?: object;
}

export interface ITicketCounterBody {
  year: string;
  counter: number;
}

export interface ITicketCounterResults {
  results: ITicketCounter[];
  page: number;
  totalPages: number;
  total: number;
}
