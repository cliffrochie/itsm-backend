import { Request, Response } from "express-serve-static-core";
import {
  IServiceRating,
  IServiceTicketBody,
  IServiceTicketFilter,
  IServiceTicketQueryParams,
  IServiceTicketResults,
} from "../@types/IServiceTicket";
import sorter from "../utils/sorter";
import { IUser, IUserRequest } from "../@types/IUser";
import { Types } from "mongoose";
import {
  capitalizeFirstLetter,
  generateTicketNo,
  generateTicket,
} from "../utils";
import User from "../models/User";
import ServiceTicket from "../models/ServiceTicket";
import { createNotification } from "../utils/notification";

interface LogRequest extends IUserRequest {
  serviceTicketId?: string;
  logDetails?: string;
}

export async function getServiceTickets(
  req: Request<{}, {}, {}, IServiceTicketQueryParams>,
  res: Response
) {
  try {
    const {
      ticketNo,
      taskType,
      title,
      natureOfWork,
      serialNo,
      equipmentType,
      defectsFound,
      serviceRendered,
      serviceStatus,
      priority,
      remarks,
      adminRemarks,
      rating,
      ratingComment,
      sort,
      includes,
      noPage,
      client,
      clientId,
      serviceEngineer,
      serviceEngineerId,
      createdBy,
    } = req.query;

    console.log(clientId);

    const filter: IServiceTicketFilter = {};
    const sortResult = await sorter(sort);

    if (ticketNo) filter.ticketNo = { $regex: ticketNo + ".*", $options: "i" };
    if (taskType) filter.taskType = { $regex: taskType + ".*", $options: "i" };
    if (title) filter.title = { $regex: title + ".*", $options: "i" };
    if (natureOfWork)
      filter.natureOfWork = { $regex: natureOfWork + ".*", $options: "i" };
    if (serialNo) filter.serialNo = { $regex: serialNo + ".*", $options: "i" };
    if (equipmentType)
      filter.equipmentType = { $regex: equipmentType + ".*", $options: "i" };
    if (defectsFound)
      filter.defectsFound = { $regex: defectsFound + ".*", $options: "i" };
    if (serviceRendered)
      filter.serviceRendered = {
        $regex: serviceRendered + ".*",
        $options: "i",
      };
    if (serviceStatus)
      filter.serviceStatus = { $regex: serviceStatus + ".*", $options: "i" };
    if (priority) filter.priority = { $regex: priority + ".*", $options: "i" };
    if (remarks) filter.remarks = { $regex: remarks + ".*", $options: "i" };
    if (adminRemarks)
      filter.adminRemarks = { $regex: adminRemarks + ".*", $options: "i" };
    if (rating) filter.rating = { $regex: rating + ".*", $options: "i" };
    if (ratingComment)
      filter.ratingComment = { $regex: ratingComment + ".*", $options: "i" };
    if (clientId) filter.client = clientId;
    if (serviceEngineerId) filter.serviceEngineer = serviceEngineerId;
    if (createdBy) filter.createdBy = createdBy;

    const clientFilter = client
      ? {
          $or: [
            { firstName: { $regex: client, $options: "i" } },
            { lastName: { $regex: client, $options: "i" } },
          ],
        }
      : {};

    const serviceEngineerFilter = serviceEngineer
      ? {
          $or: [
            { firstName: { $regex: serviceEngineer, $options: "i" } },
            { lastName: { $regex: serviceEngineer, $options: "i" } },
          ],
        }
      : {};

    const page: number = Number(req.query.page) || 1;
    const limit: number = req.query.limit || 10;
    const skip: number = (page - 1) * limit;

    let serviceTickets = [];
    let filteredServiceTickets = [];

    if (noPage) {
      serviceTickets = await ServiceTicket.find(filter).sort(sortResult);
      res.json(serviceTickets);
      return;
    }

    if (includes === "all") {
      serviceTickets = await ServiceTicket.find(filter)
        .populate({
          path: "serviceEngineer",
          match: serviceEngineerFilter,
        })
        .populate({
          path: "client",
          match: clientFilter,
        })
        .populate("createdBy")
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    } else if (includes === "serviceEngineer") {
      serviceTickets = await ServiceTicket.find(filter)
        .populate({
          path: "serviceEngineer",
          match: serviceEngineerFilter,
        })
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    } else if (includes === "client") {
      serviceTickets = await ServiceTicket.find(filter)
        .populate({
          path: "client",
          match: clientFilter,
        })
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    } else {
      serviceTickets = await ServiceTicket.find(filter)
        .sort(sortResult)
        .skip(skip)
        .limit(limit);
    }

    filteredServiceTickets = serviceTickets.filter((serviceTicket) => {
      const hasMatchingOffice = client ? serviceTicket.client : true;
      const hasMatchingDesignation = serviceEngineer
        ? serviceTicket.serviceEngineer
        : true;
      return hasMatchingOffice && hasMatchingDesignation;
    });

    // console.log(filteredServiceTickets)
    // console.log('----')
    // console.log(serviceTickets)

    const total = await ServiceTicket.find(filter).countDocuments();

    const results: IServiceTicketResults = {
      results: filteredServiceTickets,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
    res.json(results);
  } catch (error) {
    console.error(`Error [getServiceTickets]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getServiceTicket(req: Request, res: Response) {
  try {
    const serviceTicketId = req.params.serviceTicketId;
    const serviceTicket = await ServiceTicket.findById(serviceTicketId)
      .populate({
        path: "client",
        populate: [{ path: "designation" }, { path: "office" }],
      })
      .populate("serviceEngineer")
      .populate("createdBy");

    if (!serviceTicket) {
      res.status(404).json({ message: "`ServiceTicket` not found" });
      return;
    } else {
      res.json(serviceTicket);
    }
  } catch (error) {
    console.error(`Error [getServiceTicket]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getGeneratedTicketNo(req: Request, res: Response) {
  try {
    // console.log('----')
    const ticket = await generateTicket("Printer", "Consultation");
    // console.log(ticket)
    res.json({ ticket: ticket });
  } catch (error) {
    console.error(`Error [getGeneratedTicketNo]: ${error}`);
    res.status(400).json(error);
  }
}

export async function createServiceTicket(req: LogRequest, res: Response) {
  try {
    const body: IServiceTicketBody = req.body;
    const ticket = await generateTicket(body.equipmentType, body.taskType);

    const adminUsers = await User.find({ role: "admin" });

    const serviceTicket = new ServiceTicket({
      ticketNo: ticket,
      taskType: body.taskType,
      title: body.title,
      natureOfWork: body.natureOfWork,
      serialNo: body.serialNo,
      equipmentType: body.equipmentType,
      defectsFound: body.defectsFound,
      serviceRendered: body.serviceRendered,
      serviceStatus: body.serviceStatus,
      priority: body.priority,
      remarks: body.remarks,
      adminRemarks: body.adminRemarks,
      serviceEngineer: body.serviceEngineer
        ? new Types.ObjectId(body.serviceEngineer)
        : undefined,
      client: body.client ? new Types.ObjectId(body.client) : undefined,
      createdBy: req.userId ? new Types.ObjectId(req.userId) : undefined,
    });

    const authenticatedUser = await User.findById(req.userId);
    if (!authenticatedUser) {
      res.status(404).json({ message: "`User` not found" });
      return;
    }

    const result = await serviceTicket.save();
    if (!result) {
      res
        .status(400)
        .json({ message: "Error [createServiceTicket]: Something went wrong" });
      return;
    }

    adminUsers.forEach((admin) => {
      const message = `A new service request with a ticket number ${serviceTicket.ticketNo} is being created.`;
      const serviceTicketId = serviceTicket ? serviceTicket._id : "";
      createNotification(
        admin._id,
        serviceTicketId.toString(),
        serviceTicket.ticketNo,
        message
      );
    });

    req.serviceTicketId = String(serviceTicket._id);
    req.logDetails = `${
      serviceTicket.ticketNo
    } is created by ${capitalizeFirstLetter(
      authenticatedUser.firstName
    )} ${capitalizeFirstLetter(authenticatedUser.lastName)}.`;
    res.status(201).json(serviceTicket);
  } catch (error) {
    console.error(`Error [createServiceTicket]: ${error}`);
    res.status(400).json(error);
  }
}

export async function updateServiceTicket(req: LogRequest, res: Response) {
  try {
    const body: IServiceTicketBody = req.body;
    // console.log(body)

    const serviceTicketId = req.params.serviceTicketId;
    const serviceTicket = await ServiceTicket.findById(serviceTicketId);
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    req.serviceTicketId = serviceTicketId;

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "`User` not found" });
      return;
    }
    const userFullName =
      capitalizeFirstLetter(user.firstName) +
      " " +
      capitalizeFirstLetter(user.lastName);

    // Update Service Status
    if (serviceTicket.serviceStatus !== body.serviceStatus) {
      req.logDetails = `Service status is updated from "${serviceTicket.serviceStatus}" to "${body.serviceStatus}." by ${userFullName}`;
    }

    // Update priority level
    if (serviceTicket.priority !== body.priority) {
      req.logDetails = `Priority level is updated from "${
        serviceTicket.priority ? serviceTicket.priority : "none"
      }" to "${body.priority}" by ${userFullName}.`;
    }

    let statusAssigned = "";
    // Assign Service Engineer
    if (
      serviceTicket.serviceEngineer === null &&
      String(serviceTicket.serviceEngineer) !== String(req.body.serviceEngineer)
    ) {
      const newServiceEngineer = await User.findById(req.body.serviceEngineer);
      if (!newServiceEngineer) {
        res.status(404).json({ message: "`Service Engineer` not found" });
        return;
      }
      const newFullName =
        capitalizeFirstLetter(newServiceEngineer.firstName) +
        " " +
        capitalizeFirstLetter(newServiceEngineer.lastName);
      statusAssigned = "assigned";
      req.logDetails = `Service is assigned to ${newFullName} with ${
        body.priority ? body.priority : "no"
      } priority level by ${userFullName}.`;
    }

    // Escalate Problem
    if (
      serviceTicket.serviceEngineer !== null &&
      String(serviceTicket.serviceEngineer) !== String(body.serviceEngineer)
    ) {
      const newServiceEngineer = await User.findById(req.body.serviceEngineer);
      if (!newServiceEngineer) {
        res.status(404).json({ message: "`Service Engineer` not found" });
        return;
      }

      const oldServiceEngineer = await User.findById(
        serviceTicket.serviceEngineer
      );
      if (!oldServiceEngineer) {
        res.status(404).json({ message: "`Service Engineer` not found" });
        return;
      }

      const oldFullName =
        capitalizeFirstLetter(oldServiceEngineer.firstName) +
        " " +
        capitalizeFirstLetter(oldServiceEngineer.lastName);
      const newFullName =
        capitalizeFirstLetter(newServiceEngineer.firstName) +
        " " +
        capitalizeFirstLetter(newServiceEngineer.lastName);

      req.logDetails = `Service is escalted from ${oldFullName} to ${newFullName} with ${
        body.priority ? body.priority : "no"
      } priority level by ${userFullName}.`;
    }

    // Defects Found
    if (body.defectsFound && serviceTicket.defectsFound !== body.defectsFound) {
      req.logDetails = `The problem or cause is "${body.defectsFound}."`;
    }

    // Service Rendered
    if (
      body.serviceRendered &&
      serviceTicket.serviceRendered !== body.serviceRendered
    ) {
      req.logDetails = `The service rendered is "${body.serviceRendered}."`;
    }

    if (
      body.defectsFound &&
      body.serviceRendered &&
      serviceTicket.defectsFound !== body.defectsFound &&
      serviceTicket.serviceRendered !== body.serviceRendered
    ) {
      req.logDetails = `The problem or cause is "${body.defectsFound}" and the rendered service is "${body.serviceRendered}" by ${userFullName}.`;
    }

    serviceTicket.ticketNo = body.ticketNo;
    serviceTicket.taskType = body.taskType;
    serviceTicket.title = body.title;
    serviceTicket.natureOfWork = body.natureOfWork;
    serviceTicket.serialNo = body.serialNo;
    serviceTicket.equipmentType = body.equipmentType;
    serviceTicket.defectsFound = body.defectsFound;
    serviceTicket.serviceRendered = body.serviceRendered;
    serviceTicket.serviceStatus =
      statusAssigned === "assigned" ? statusAssigned : body.serviceStatus;
    serviceTicket.priority = body.priority;
    serviceTicket.remarks = body.remarks;
    serviceTicket.adminRemarks = body.adminRemarks;
    serviceTicket.serviceEngineer = body.serviceEngineer
      ? new Types.ObjectId(body.serviceEngineer)
      : undefined;
    serviceTicket.client = body.client
      ? new Types.ObjectId(body.client)
      : undefined;
    serviceTicket.updatedBy = req.userId
      ? new Types.ObjectId(req.userId)
      : undefined;

    await serviceTicket.save();
    res.status(200).json(serviceTicket);
  } catch (error) {
    console.error(`Error [updateServiceTicket]: ${error}`);
    res.status(400).json(error);
  }
}

export async function removeServiceTicket(req: Request, res: Response) {
  try {
    const serviceTicketId = req.params.serviceTicketId;
    const deleted = await ServiceTicket.findByIdAndDelete(serviceTicketId);

    if (deleted) {
      res.status(204).json({});
    } else {
      res.status(500).json({
        message: "Error [removeServiceTicket]: Something went wrong.",
      });
    }
  } catch (error) {
    console.error(`Error [removeServiceTicket]: ${error}`);
    res.status(400).json(error);
  }
}

export async function updateServiceStatus(req: LogRequest, res: Response) {
  try {
    const body: {
      serviceStatus:
        | ""
        | "open"
        | "in progress"
        | "on hold"
        | "escalated"
        | "canceled"
        | "reopened"
        | "resolved"
        | "closed";
    } = req.body;

    const serviceTicketId = req.params.serviceTicketId;
    const serviceTicket = await ServiceTicket.findById(serviceTicketId);
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "`User` not found" });
      return;
    }
    const userFullName =
      capitalizeFirstLetter(user.firstName) +
      " " +
      capitalizeFirstLetter(user.lastName);

    if (serviceTicket.serviceStatus !== body.serviceStatus) {
      req.serviceTicketId = serviceTicketId;
      req.logDetails = `Service status is updated from "${serviceTicket.serviceStatus}" to "${body.serviceStatus}" by ${userFullName}.`;
      serviceTicket.serviceStatus = body.serviceStatus;
      serviceTicket.updatedBy = req.userId
        ? new Types.ObjectId(req.userId)
        : undefined;
      const done = await serviceTicket.save();

      if (!done) {
        res.status(400).json({
          message: "Error [updateServiceStatus]: Something went wrong.",
        });
        return;
      }

      let requestor = "";
      if (serviceTicket.createdBy)
        requestor = serviceTicket.createdBy.toString();
      let message = `Service status for ${serviceTicket.ticketNo} is updated to "${serviceTicket.serviceStatus}".`;

      switch (serviceTicket.serviceStatus) {
        case "open":
          message = `${serviceTicket.ticketNo} is now open.`;
          break;
        case "in progress":
          message = `Service engineer is now working for ${serviceTicket.ticketNo}.`;
          break;
        case "on hold":
          message = `${serviceTicket.ticketNo} has been put on hold.`;
          break;
        case "escalated":
          message = `${serviceTicket.ticketNo} has been escalated to another service engineer.`;
          break;
        case "canceled":
          message = `${serviceTicket.ticketNo} has been canceled by the administrator.`;
          break;
        case "reopened":
          message = `${serviceTicket.ticketNo} has been re-opened by the administrator.`;
          break;
        case "resolved":
          message = `The service engineer has completed its task for ${serviceTicket.ticketNo}, please provide a feedback to his/her performance.`;
          break;
        case "resolved":
          message = `Ticket ${serviceTicket.ticketNo} is now closed by ${userFullName}.`;
          break;
      }

      await createNotification(
        requestor,
        serviceTicketId,
        serviceTicket.ticketNo,
        message
      );

      res.status(200).json(serviceTicket);
      return;
    }

    res
      .status(500)
      .json({ message: "Error [updateServiceStatus]: Something went wrong." });
    return;
  } catch (error) {
    console.error(`Error [updateServiceStatus]: ${error}`);
    res.status(400).json(error);
  }
}

export async function assignServiceEngineer(req: LogRequest, res: Response) {
  try {
    const body: {
      serviceEngineer?: string;
      priority?: "" | "low" | "medium" | "high";
      adminRemarks?: string;
    } = req.body;

    const serviceTicketId = req.params.serviceTicketId;
    const serviceTicket = await ServiceTicket.findById(serviceTicketId);
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    if (
      (serviceTicket.serviceEngineer !== null ||
        serviceTicket.serviceEngineer !== undefined) &&
      body.serviceEngineer &&
      body.priority
    ) {
      const serviceEngineer = await User.findById(body.serviceEngineer);
      if (!serviceEngineer) {
        res.status(404).json({ message: "`Service Engineer` not found" });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: "`User` not found" });
        return;
      }

      const serviceEngineerFullName =
        capitalizeFirstLetter(serviceEngineer.firstName) +
        " " +
        capitalizeFirstLetter(serviceEngineer.lastName);
      const userFullName =
        capitalizeFirstLetter(user.firstName) +
        " " +
        capitalizeFirstLetter(user.lastName);

      req.serviceTicketId = serviceTicketId;
      req.logDetails = `Service is assigned to ${serviceEngineerFullName} with ${
        body.priority ? body.priority : "no"
      } priority level by ${userFullName}.`;

      serviceTicket.serviceEngineer = new Types.ObjectId(body.serviceEngineer);
      serviceTicket.serviceStatus = "assigned";
      serviceTicket.priority = body.priority;
      serviceTicket.adminRemarks = body.adminRemarks;
      serviceTicket.updatedBy = req.userId
        ? new Types.ObjectId(req.userId)
        : undefined;
      const done = await serviceTicket.save();

      if (!done) {
        res.status(400).json({
          message: "Error [assignServiceEngineer]: Something went wrong.",
        });
        return;
      }

      let requestor = "";
      if (serviceTicket.createdBy)
        requestor = serviceTicket.createdBy.toString();
      const message = `A service engineer is assigned to ${serviceTicket.ticketNo}.`;
      await createNotification(
        requestor,
        serviceTicketId,
        serviceTicket.ticketNo,
        message
      );

      const message2 = `You are assigned as service engineer for ${serviceTicket.ticketNo}.`;
      await createNotification(
        serviceTicket.serviceEngineer.toString(),
        serviceTicketId,
        serviceTicket.ticketNo,
        message2
      );

      res.status(200).json(serviceTicket);
      return;
    }

    res.status(500).json({
      message: "Error [assignServiceEngineer]: Something went wrong.",
    });
    return;
  } catch (error) {
    console.error(`Error [assignServiceEngineer]: ${error}`);
    res.status(400).json(error);
  }
}

export async function escalateService(req: LogRequest, res: Response) {
  try {
    const body: {
      serviceEngineer: string;
      priority: "" | "low" | "medium" | "high";
      remarks: string;
      adminRemarks: string;
    } = req.body;

    const serviceTicketId = req.params.serviceTicketId;
    const serviceTicket = await ServiceTicket.findById(serviceTicketId);
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    if (
      serviceTicket.serviceEngineer &&
      body.serviceEngineer &&
      String(serviceTicket.serviceEngineer) !== String(body.serviceEngineer)
    ) {
      const newServiceEngineer = await User.findById(req.body.serviceEngineer);
      if (!newServiceEngineer) {
        res.status(404).json({ message: "`Service Engineer` not found" });
        return;
      }

      const oldServiceEngineer = await User.findById(
        serviceTicket.serviceEngineer
      );
      if (!oldServiceEngineer) {
        res.status(404).json({ message: "`Service Engineer` not found" });
        return;
      }

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ message: "`User` not found" });
        return;
      }

      const oldFullName =
        capitalizeFirstLetter(oldServiceEngineer.firstName) +
        " " +
        capitalizeFirstLetter(oldServiceEngineer.lastName);
      const newFullName =
        capitalizeFirstLetter(newServiceEngineer.firstName) +
        " " +
        capitalizeFirstLetter(newServiceEngineer.lastName);
      const userFullName =
        capitalizeFirstLetter(user.firstName) +
        " " +
        capitalizeFirstLetter(user.lastName);

      req.serviceTicketId = serviceTicketId;
      req.logDetails = `Service is escalated from ${oldFullName} to ${newFullName} with ${body.priority} priority level by ${userFullName}.`;

      serviceTicket.serviceEngineer = new Types.ObjectId(body.serviceEngineer);
      serviceTicket.serviceStatus = "escalated";
      serviceTicket.priority = body.priority;
      serviceTicket.remarks = body.remarks;
      serviceTicket.adminRemarks = body.adminRemarks;
      serviceTicket.updatedBy = req.userId
        ? new Types.ObjectId(req.userId)
        : undefined;
      const done = await serviceTicket.save();

      if (!done) {
        res
          .status(400)
          .json({ message: "Error [escalateService]: Something went wrong." });
        return;
      }

      let requestor = "";
      if (serviceTicket.createdBy)
        requestor = serviceTicket.createdBy.toString();
      const message = `${serviceTicket.ticketNo} has been escalated to other service engineer.`;
      await createNotification(
        requestor,
        serviceTicketId,
        serviceTicket.ticketNo,
        message
      );

      const message1 = `${serviceTicket.ticketNo} has been escalated to you.`;
      await createNotification(
        newServiceEngineer._id.toString(),
        serviceTicketId,
        serviceTicket.ticketNo,
        message1
      );

      const message2 = `You have been removed as service engineer for ${serviceTicket.ticketNo} and escalated to another service engineer.`;
      await createNotification(
        oldServiceEngineer._id.toString(),
        serviceTicketId,
        serviceTicket.ticketNo,
        message2
      );

      res.status(200).json(serviceTicket);
      return;
    }

    res
      .status(500)
      .json({ message: "Error [escalateService]: Something went wrong." });
    return;
  } catch (error) {
    console.error(`Error [escalateService]: ${error}`);
    res.status(400).json(error);
  }
}

export async function inputFindings(req: LogRequest, res: Response) {
  try {
    const body: {
      findings: string;
    } = req.body;

    const serviceTicketId = req.params.serviceTicketId;
    const serviceTicket = await ServiceTicket.findById(serviceTicketId);
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    const assignedServiceEngineer = await User.findById(
      serviceTicket.serviceEngineer
    );
    if (!assignedServiceEngineer) {
      res
        .status(404)
        .json({ message: "`Assigned Service Engineer` not found" });
      return;
    }
    const serviceEngineerName =
      capitalizeFirstLetter(assignedServiceEngineer.firstName) +
      " " +
      capitalizeFirstLetter(assignedServiceEngineer.lastName);

    serviceTicket.defectsFound = body.findings;
    serviceTicket.updatedBy = req.userId
      ? new Types.ObjectId(req.userId)
      : undefined;
    const done = await serviceTicket.save();

    if (!done) {
      res
        .status(400)
        .json({ message: "Error [inputFindings]: Something went wrong." });
      return;
    }

    let requestor = "";
    if (serviceTicket.createdBy) requestor = serviceTicket.createdBy.toString();
    const message = `Service engineer for ${serviceTicket.ticketNo} had set its findings.`;
    await createNotification(
      requestor,
      serviceTicketId,
      serviceTicket.ticketNo,
      message
    );

    req.serviceTicketId = serviceTicketId;
    req.logDetails = `Diagnosis / findings is set to "${serviceTicket.defectsFound}" by ${serviceEngineerName}`;
    res.status(200).json(serviceTicket);
    return;
  } catch (error) {
    console.error(`Error [inputFindings]: ${error}`);
    res.status(400).json(error);
  }
}

export async function inputServiceRendered(req: LogRequest, res: Response) {
  try {
    const body: {
      serviceRendered: string;
    } = req.body;

    const serviceTicketId = req.params.serviceTicketId;
    const serviceTicket = await ServiceTicket.findById(serviceTicketId);
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    const assignedServiceEngineer = await User.findById(
      serviceTicket.serviceEngineer
    );
    if (!assignedServiceEngineer) {
      res
        .status(404)
        .json({ message: "`Assigned Service Engineer` not found" });
      return;
    }
    const serviceEngineerName =
      capitalizeFirstLetter(assignedServiceEngineer.firstName) +
      " " +
      capitalizeFirstLetter(assignedServiceEngineer.lastName);

    serviceTicket.serviceRendered = body.serviceRendered;
    serviceTicket.updatedBy = req.userId
      ? new Types.ObjectId(req.userId)
      : undefined;
    const done = await serviceTicket.save();

    if (!done) {
      res
        .status(400)
        .json({ message: "Error [inputFindings]: Something went wrong." });
      return;
    }

    let requestor = "";
    if (serviceTicket.createdBy) requestor = serviceTicket.createdBy.toString();
    const message = `Service engineer for ${serviceTicket.ticketNo} has rendered its service/action taken.`;
    await createNotification(
      requestor,
      serviceTicketId,
      serviceTicket.ticketNo,
      message
    );

    req.serviceTicketId = serviceTicketId;
    req.logDetails = `Service rendered / action taken is set to "${serviceTicket.serviceRendered}" by ${serviceEngineerName}.`;
    res.status(200).json(serviceTicket);
    return;
  } catch (error) {
    console.error(`Error [inputServiceRendered]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getRequestedServiceTickets(
  req: IUserRequest,
  res: Response
) {
  try {
    const currentUser = await User.findById(req.userId);
    if (currentUser && currentUser.role !== "user") {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }

    // const serviceTickets = await ServiceTicket.find({ createdBy: req.userId, serviceStatus: {$ne: 'closed'} })
    const serviceTickets = await ServiceTicket.find({
      createdBy: req.userId,
      rating: { $eq: "" },
    })
      .populate("client")
      .populate({ path: "serviceEngineer", select: "-password" })
      .sort({ createdAt: -1 });
    res.status(200).json(serviceTickets);
  } catch (error) {
    console.error(`Error [getRequestedServiceTickets]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getAssignedServiceTickets(
  req: IUserRequest,
  res: Response
) {
  try {
    const currentUser = await User.findById(req.userId).sort();
    if (currentUser && currentUser.role === "user") {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }

    const serviceTickets = await ServiceTicket.find({
      serviceEngineer: req.userId,
      serviceStatus: { $ne: "closed" },
    }).sort({ createdAt: -1 });
    res.status(200).json(serviceTickets);
  } catch (error) {
    console.error(`Error [getAssignedServiceTickets]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getAssignedClosedServiceTickets(
  req: IUserRequest,
  res: Response
) {
  try {
    const currentUser = await User.findById(req.userId).sort();
    if (currentUser && currentUser.role === "user") {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }

    const serviceTickets = await ServiceTicket.find({
      serviceEngineer: req.userId,
      serviceStatus: "closed",
    }).sort({ createdAt: -1 });
    res.status(200).json(serviceTickets);
  } catch (error) {
    console.error(`Error [getAssignedServiceTickets]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getTotalServiceStatuses(
  req: Request<{}, {}, {}, IServiceTicketQueryParams>,
  res: Response
) {
  try {
    const {
      totalTickets,
      totalOpenedTickets,
      totalAssignedTickets,
      totalInProgressTickets,
      totalOnHoldTickets,
      totalEscalatedTickets,
      totalCanceledTickets,
      totalReOpenedTickets,
      totalResolvedTickets,
      totalClosedTickets,
    } = req.query;

    let result = {};

    if (totalTickets) {
      const total = await ServiceTicket.countDocuments();
      result = { ...result, totalTickets: total };
    }
    if (totalOpenedTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "open",
      }).countDocuments();
      result = { ...result, totalOpenedTickets: total };
    }
    if (totalAssignedTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "assigned",
      }).countDocuments();
      result = { ...result, totalAssignedTickets: total };
    }
    if (totalInProgressTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "in progress",
      }).countDocuments();
      result = { ...result, totalInProgressTickets: total };
    }
    if (totalOnHoldTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "on hold",
      }).countDocuments();
      result = { ...result, totalOnHoldTickets: total };
    }
    if (totalEscalatedTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "escalated",
      }).countDocuments();
      result = { ...result, totalEscalatedTickets: total };
    }
    if (totalCanceledTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "canceled",
      }).countDocuments();
      result = { ...result, totalCanceledTickets: total };
    }
    if (totalReOpenedTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "reopened",
      }).countDocuments();
      result = { ...result, totalReOpenedTickets: total };
    }
    if (totalResolvedTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "resolved",
      }).countDocuments();
      result = { ...result, totalResolvedTickets: total };
    }
    if (totalClosedTickets) {
      const total = await ServiceTicket.find({
        serviceStatus: "closed",
      }).countDocuments();
      result = { ...result, totalClosedTickets: total };
    }

    res.json(result);
  } catch (error) {
    console.error(`Error [getTotalServiceStatuses]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getTotalTaskTypes(
  req: Request<{}, {}, {}, IServiceTicketQueryParams>,
  res: Response
) {
  try {
    const {
      totalTickets,
      totalIncident,
      totalServiceRequest,
      totalAssetRequest,
      totalMaintenance,
      totalConsultation,
      totalAccessibility,
    } = req.query;

    let result = {};

    if (totalTickets) {
      const total = await ServiceTicket.countDocuments();
      result = { ...result, totalTickets: total };
    }
    if (totalIncident) {
      const total = await ServiceTicket.find({
        taskType: "incident",
      }).countDocuments();
      result = { ...result, totalIncident: total };
    }
    if (totalServiceRequest) {
      const total = await ServiceTicket.find({
        taskType: "service request",
      }).countDocuments();
      result = { ...result, totalServiceRequest: total };
    }
    if (totalAssetRequest) {
      const total = await ServiceTicket.find({
        taskType: "asset request",
      }).countDocuments();
      result = { ...result, totalAssetRequest: total };
    }
    if (totalMaintenance) {
      const total = await ServiceTicket.find({
        taskType: "maintenace",
      }).countDocuments();
      result = { ...result, totalMaintenance: total };
    }
    if (totalConsultation) {
      const total = await ServiceTicket.find({
        taskType: "consultation",
      }).countDocuments();
      result = { ...result, totalConsultation: total };
    }
    if (totalAccessibility) {
      const total = await ServiceTicket.find({
        taskType: "accessibility",
      }).countDocuments();
      result = { ...result, totalAccessibility: total };
    }

    res.json(result);
  } catch (error) {
    console.error(`Error [getTotalTaskTypes]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getTotalEquipmentTypes(
  req: Request<{}, {}, {}, IServiceTicketQueryParams>,
  res: Response
) {
  try {
    const {
      totalTickets,
      totalComputer,
      totalPrinter,
      totalScanner,
      totalMobileDevice,
      totalNetworkRelated,
      totalSoftwareApplication,
      totalOthers,
    } = req.query;

    let result = {};

    if (totalTickets) {
      const total = await ServiceTicket.countDocuments();
      result = { ...result, totalTickets: total };
    }
    if (totalComputer) {
      const total = await ServiceTicket.find({
        equipmentType: "computer",
      }).countDocuments();
      result = { ...result, totalComputer: total };
    }
    if (totalPrinter) {
      const total = await ServiceTicket.find({
        equipmentType: "printer",
      }).countDocuments();
      result = { ...result, totalPrinter: total };
    }
    if (totalScanner) {
      const total = await ServiceTicket.find({
        equipmentType: "scanner",
      }).countDocuments();
      result = { ...result, totalScanner: total };
    }
    if (totalMobileDevice) {
      const total = await ServiceTicket.find({
        equipmentType: "mobile device",
      }).countDocuments();
      result = { ...result, totalMobileDevice: total };
    }
    if (totalNetworkRelated) {
      const total = await ServiceTicket.find({
        equipmentType: "network related",
      }).countDocuments();
      result = { ...result, totalNetworkRelated: total };
    }
    if (totalSoftwareApplication) {
      const total = await ServiceTicket.find({
        equipmentType: "software application",
      }).countDocuments();
      result = { ...result, totalSoftwareApplication: total };
    }
    if (totalOthers) {
      const total = await ServiceTicket.find({
        equipmentType: "others",
      }).countDocuments();
      result = { ...result, totalOthers: total };
    }

    res.json(result);
  } catch (error) {
    console.error(`Error [getTotalEquipmentTypes]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getSearchedTicketNo(req: IUserRequest, res: Response) {
  try {
    const { v } = req.query;
    const filter: IServiceTicketFilter = {};

    if (v) filter.ticketNo = { $regex: `^${v}`, $options: "i" };

    const serviceTicket = await ServiceTicket.find(filter)
      .populate({
        path: "client",
        populate: [{ path: "office" }, { path: "designation" }],
      })
      .populate("serviceEngineer")
      .sort({ createdAt: -1 });

    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    res.json(serviceTicket);
  } catch (error) {
    console.error(`Error [getSearchedTicketNo]: ${error}`);
    res.status(400).json(error);
  }
}

export async function setServiceRating(req: LogRequest, res: Response) {
  try {
    const { rating, ratingComment }: IServiceRating = req.body;
    const serviceTicket = await ServiceTicket.findById(
      req.params.serviceTicketId
    );
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    serviceTicket.rating = rating;
    serviceTicket.ratingComment = ratingComment;
    const done = await serviceTicket.save();
    if (done) {
      const message = `Ticket owner provided a rating/feedback to your service performance.`;
      await createNotification(
        serviceTicket.serviceEngineer
          ? serviceTicket.serviceEngineer.toString()
          : "",
        serviceTicket._id ? serviceTicket._id.toString() : "",
        serviceTicket.ticketNo,
        message
      );
      req.logDetails = `Ticket owner provided a feedback to the service(s) with a rating of ${rating} stars and a feedback/comment: "${ratingComment}."`;
      res.status(200).json(serviceTicket);
    } else {
      res.status(400).json({ message: "Something went wrong." });
    }
  } catch (error) {
    console.error(`Error [setServiceRating]: ${error}`);
    res.status(400).json(error);
  }
}

export async function closeTicket(req: LogRequest, res: Response) {
  try {
    const serviceTicket = await ServiceTicket.findById(
      req.params.serviceTicketId
    );
    if (!serviceTicket) {
      res.status(404).json({ message: "`Service Ticket` not found" });
      return;
    }

    const authenticatedUser = await User.findById(req.userId);
    if (!authenticatedUser) {
      res.status(404).json({ message: "`User` not found" });
      return;
    }

    serviceTicket.serviceStatus = "closed";
    const done = await serviceTicket.save();
    if (done) {
      req.serviceTicketId = req.params.serviceTicketId;
      req.logDetails = `Ticket has been closed by ${capitalizeFirstLetter(
        authenticatedUser.firstName
      )} ${capitalizeFirstLetter(authenticatedUser.lastName)}.`;
      res.status(200).json(serviceTicket);
    } else {
      res.status(400).json({ message: "Something went wrong." });
    }
  } catch (error) {
    console.error(`Error [closeTicket]: ${error}`);
    res.status(400).json(error);
  }
}
