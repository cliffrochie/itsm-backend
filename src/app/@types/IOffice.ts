import { Document, Types } from "mongoose";
import { IUser } from "./IUser";

export interface IOffice extends Document {
  name: string;
  alias: string;
  officeType:
    | "unit"
    | "section"
    | "division"
    | "irrigation system"
    | "satellite office"
    | "irrigation management office"
    | "regional office";
  parentOffice?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOfficeQueryParams {
  name?: string;
  alias?: string;
  officeType?: string;
  parentOffice?: string;
  includes?: string;
  sort?: string;
  page?: number;
  limit?: number;
  noPage?: boolean;
}

export interface IOfficeFilter {
  name?: object;
  alias?: object;
  officeType?: object;
  parentOffice?: object;
}

export interface IOfficeBody {
  name: string;
  alias: string;
  officeType:
    | "unit"
    | "section"
    | "division"
    | "irrigation system"
    | "satellite office"
    | "irrigation management office"
    | "regional office";
  parentOffice: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface IOfficeResults {
  results: IOffice[];
  page: number;
  totalPages: number;
  total: number;
}
