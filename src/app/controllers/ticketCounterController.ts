import { Request, Response } from "express-serve-static-core";
import sorter from "../utils/sorter";
import { Types } from "mongoose";
import {
  ITicketCounter,
  ITicketCounterQueryParams,
  ITicketCounterFilter,
  ITicketCounterBody,
  ITicketCounterResults,
} from "../@types/ITicketCounter";
import TicketCounter from "../models/TicketCounter";
import { IUserRequest } from "../@types/IUser";

export async function getTicketCounters(
  req: Request<{}, {}, {}, ITicketCounterQueryParams>,
  res: Response
) {
  try {
    const { year, counter, noPage } = req.query;
    const filter: ITicketCounterFilter = {};
    const sortResult = await sorter(req.query.sort);

    if (year) filter.year = { $regex: year + ".*", $options: "i" };
    if (counter) filter.counter = { $regex: counter + ".*", $options: "i" };

    const page: number = Number(req.query.page) || 1;
    const limit: number = req.query.limit || 10;
    const skip: number = (page - 1) * limit;

    let ticketCounters = [];

    if (noPage) {
      ticketCounters = await TicketCounter.find(filter).sort(sortResult);
      res.json(ticketCounters);
      return;
    }

    ticketCounters = await TicketCounter.find(filter)
      .sort(sortResult)
      .skip(skip)
      .limit(limit);
    const total = await TicketCounter.find(filter).countDocuments();

    const results: ITicketCounterResults = {
      results: ticketCounters,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    };
    res.json(results);
  } catch (error) {
    console.error(`Error [getTicketCounters]: ${error}`);
    res.status(400).json(error);
  }
}

export async function getTicketCounter(req: Request, res: Response) {
  try {
    const ticketCounterId = req.params.ticketCounterId;
    const ticketCounter = await TicketCounter.findById(ticketCounterId);
    if (!ticketCounter) {
      res.status(404).json({ message: "`Ticket Counter` not found" });
      return;
    }
    res.json(ticketCounter);
  } catch (error) {
    console.error(`Error [getTicketCounter]: ${error}`);
    res.status(400).json(error);
  }
}

export async function createTicketCounter(req: IUserRequest, res: Response) {
  try {
    const body: ITicketCounterBody = req.body;
    const ticketCounter = new TicketCounter({
      year: body.year,
      counter: body.counter,
      createdBy: req.userId ? new Types.ObjectId(req.userId) : undefined,
    });

    await ticketCounter.save();
    res.status(201).json(ticketCounter);
  } catch (error) {
    console.error(`Error [createTicketCounter]: ${error}`);
    res.status(400).json(error);
  }
}

export async function updateTicketCounter(req: IUserRequest, res: Response) {
  try {
    const body: ITicketCounterBody = req.body;
    const ticketCounterId = req.params.ticketCounterId;

    const ticketCounter = await TicketCounter.findById(ticketCounterId);
    if (!ticketCounter) {
      res.status(404).json({ message: "`Ticket Counter` not found" });
      return;
    }

    ticketCounter.year = body.year;
    ticketCounter.counter = body.counter;

    await ticketCounter.save();
    res.json(ticketCounter);
  } catch (error) {
    console.error(`Error [updateTicketCounter]: ${error}`);
    res.status(400).json(error);
  }
}

export async function removeTicketCounter(req: Request, res: Response) {
  try {
    const ticketCounterId = req.params.ticketCounterId;
    const deleted = await TicketCounter.findByIdAndDelete(ticketCounterId);

    if (deleted) {
      res.status(204).json({});
    } else {
      res
        .status(500)
        .json({
          message: "Error [removeTicketCounter]: Something went wrong.",
        });
    }
  } catch (error) {
    console.error(`Error [removeTicketCounter]: ${error}`);
    res.status(400).json(error);
  }
}
