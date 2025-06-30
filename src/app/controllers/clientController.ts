import { Request, Response } from "express-serve-static-core";
import {
  IClientBody,
  IClientFilter,
  IClientQueryParams,
  IClientResults,
  IClient,
} from "../@types/IClient";
import sorter from "../utils/sorter";
import Client from "../models/Client";
import { IUserRequest } from "../@types/IUser";
import User from "../models/User";
import Designation from "../models/Designation";
import Office from "../models/Office";
import { Types } from "mongoose";

async function getDesignation(filter: any) {
  const result = await Designation.find({ _id: filter._id });
  return result[0];
}

async function getOffice(filter: any) {
  const result = await Office.find({ _id: filter._id });
  return result[0];
}

export async function getClients(
  req: Request<{}, {}, {}, IClientQueryParams>,
  res: Response
) {
  try {
    const {
      firstName,
      lastName,
      includes,
      sort,
      noPage,
      fullName,
      office,
      designation,
      userId,
    } = req.query;

    const filter: IClientFilter = {};
    const sortResult = await sorter(sort);

    if (firstName)
      filter.firstName = { $regex: firstName + ".*", $options: "i" };
    if (lastName) filter.lastName = { $regex: lastName + ".*", $options: "i" };
    if (fullName)
      filter.$or = [
        { firstName: { $regex: fullName, $options: "i" } },
        { lastName: { $regex: fullName, $options: "i" } },
      ];
    if (userId) filter.user = userId;

    const officeFilter = office
      ? { alias: { $regex: office, $options: "i" } }
      : {};

    const designationFilter = designation
      ? { title: { $regex: designation, $options: "i" } }
      : {};

    const page: number = Number(req.query.page) || 1;
    const limit: number = req.query.limit || 10;
    const skip: number = (page - 1) * limit;

    let clients: IClient[] = [];
    let filteredClients: IClient[] = [];

    if (noPage) {
      if (includes === "all") {
        clients = await Client.find(filter)
          .populate({ path: "designation", match: designationFilter })
          .populate({ path: "office", match: officeFilter })
          .sort(sortResult);
      } else {
        clients = await Client.find(filter).sort(sortResult);
      }

      filteredClients = clients.filter((client) => {
        const hasMatchingOffice = office ? client.office : true;
        const hasMatchingDesignation = designation ? client.designation : true;
        return hasMatchingOffice && hasMatchingDesignation;
      });

      res.json(filteredClients);
      return;
    }

    if (includes === "all") {
      clients = await Client.find(filter)
        .populate({ path: "designation", match: designationFilter })
        .populate({ path: "office", match: officeFilter })
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    } else if (includes === "designation") {
      clients = await Client.find(filter)
        .populate({ path: "designation", match: designationFilter })
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    } else if (includes === "office") {
      clients = await Client.find(filter)
        .populate({ path: "office", match: officeFilter })
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    } else {
      clients = await Client.find(filter)
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    }

    if (filteredClients.length === 0) {
      filteredClients = clients;
    }

    filteredClients = clients.filter((client) => {
      const hasMatchingOffice = office ? client.office : true;
      const hasMatchingDesignation = designation ? client.designation : true;
      return hasMatchingOffice && hasMatchingDesignation;
    });

    const total = await Client.find(filter).countDocuments();

    const results: IClientResults = {
      results: filteredClients,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
    res.json(results);
  } catch (error) {
    console.error(`Error [getClients]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getClient(req: Request, res: Response) {
  try {
    const { includes } = req.query;

    const clientId = req.params.clientId;
    let client = null;

    if (includes === "all") {
      client = await Client.findById(clientId)
        .populate("designation")
        .populate("office");
    } else {
      client = await Client.findById(clientId);
    }

    if (!client) {
      res.status(404).json({ message: "`Client` not found" });
    } else {
      res.json(client);
    }
  } catch (error) {
    console.error(`Error [getClient]: ${error}`);
    res.status(400).json(error);
  }
}

export async function createClient(req: IUserRequest, res: Response) {
  try {
    const body: IClientBody = req.body;

    const client = new Client({
      user: body.user ? new Types.ObjectId(body.user) : undefined,
      firstName: body.firstName,
      middleName: body.middleName,
      lastName: body.lastName,
      extensionName: body.extensionName,
      contactNo: body.contactNo,
      email: body.email,
      designation: body.designation
        ? new Types.ObjectId(body.designation)
        : undefined,
      office: body.office ? new Types.ObjectId(body.office) : undefined,
      createdBy: req.userId ? new Types.ObjectId(req.userId) : undefined,
    });

    await client.save();
    res.status(201).json(client);
  } catch (error) {
    console.error(`Error [createClient]: ${error}`);
    res.status(400).json(error);
  }
}

export async function updateClient(req: IUserRequest, res: Response) {
  try {
    const body: IClientBody = req.body;

    const clientId = req.params.clientId;
    const client = await Client.findById(clientId);
    if (!client) {
      res.status(404).json({ message: "`Office` not found" });
      return;
    }

    client.user = body.user ? new Types.ObjectId(body.user) : undefined;
    client.firstName = body.firstName;
    client.middleName = body.middleName;
    client.lastName = body.lastName;
    client.extensionName = body.extensionName;
    client.contactNo = body.contactNo;
    client.email = body.email;
    client.designation = body.designation
      ? new Types.ObjectId(body.designation)
      : undefined;
    client.office = body.office ? new Types.ObjectId(body.office) : undefined;
    client.updatedBy = req.userId ? new Types.ObjectId(req.userId) : undefined;

    await client.save();
    res.json(client);
  } catch (error) {
    console.error(`Error [updateClient]: ${error}`);
    res.status(400).json(error);
  }
}

export async function removeClient(req: Request, res: Response) {
  try {
    const clientId = req.params.clientId;
    const deleted = await Client.findByIdAndDelete(clientId);

    if (deleted) {
      res.status(204).json({});
    } else {
      res
        .status(500)
        .json({ message: "Error [removeClient]: Something went wrong." });
    }
  } catch (error) {
    console.error(`Error [removeClient]: ${error}`);
    res.status(400).json(error);
  }
}
