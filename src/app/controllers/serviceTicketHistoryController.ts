import { Request, Response } from "express-serve-static-core";
import { IServiceTicketHistoryBody, IServiceTicketHistoryFilter, IServiceTicketHistoryQueryParams, IServiceTicketHistoryResults } from "../@types/IServiceTicketHistory";
import sorter from "../utils/sorter";
import ServiceTicketHistory from "../models/ServiceTicketHistory";
import { IUserIdRequest } from "../@types/IUser";
import { Types } from "mongoose";


export async function getServiceTicketHistories(req: Request<{}, {}, {}, IServiceTicketHistoryQueryParams>, res: Response) {
  try {
    const {
      serviceTicket,
      date,
      time,
      details,
      remarks,
      sort,
      noPage
    } = req.query

    const filter: IServiceTicketHistoryFilter = {}
    const sortResult = await sorter(sort)

    if(serviceTicket) filter.serviceTicket = { $regex: serviceTicket + '.*', $options: 'i' }
    if(date) filter.date = { $regex: date + '.*', $options: 'i' }
    if(time) filter.time = { $regex: time + '.*', $options: 'i' }
    if(details) filter.details = { $regex: details + '.*', $options: 'i' }
    if(remarks) filter.remarks = { $regex: remarks + '.*', $options: 'i' }

    const page: number = Number(req.query.page) || 1
    const limit: number = req.query.limit || 10
    const skip: number = (page - 1) * limit

    let offices = []

    if(noPage) {
      offices = await ServiceTicketHistory.find(filter).sort(sortResult)
      res.json(offices)
      return
    }

    offices = await ServiceTicketHistory.find(filter).sort(sortResult).skip(skip).limit(limit)
    const total = await ServiceTicketHistory.find(filter).countDocuments()

    const results: IServiceTicketHistoryResults = { results: offices, page, totalPages: Math.ceil(total / limit), total }
    res.json(results)
  }
  catch(error) {
    console.error(`Error [getServiceTicketHistories]: ${error}`)
    res.status(400).json(error)
  }
}


export async function getServiceTicketHistory(req: Request, res: Response) {
  try {
    const serviceTicketHistoryId = req.params.serviceTicketHistoryId
    const serviceTicketHistory = await ServiceTicketHistory.findById(serviceTicketHistoryId)
    
    if(!serviceTicketHistory) {
      res.status(404).json({ message: '`ServiceTicketHistory` not found' })
      return
    }
    else {
      res.json(serviceTicketHistory)
    }
  }
  catch(error) {
    console.error(`Error [getServiceTicketHistory]: ${error}`)
    res.status(400).json(error)
  }
}


export async function createServiceTicketHistory(req: IUserIdRequest, res: Response) {
  try {
    const body: IServiceTicketHistoryBody = req.body

    const serviceTicketHistory = new ServiceTicketHistory({
      serviceTicket: body.serviceTicket,
      date: body.date,
      time: body.time,
      details: body.details,
      remarks: body.remarks,
      createdBy: new Types.ObjectId(req.userId),
    })
    await serviceTicketHistory.save()
    res.status(201).json(serviceTicketHistory)
  }
  catch(error) {
    console.error(`Error [createServiceTicket]: ${error}`)
    res.status(400).json(error)
  }
}


export async function updateServiceTicketHistory(req: IUserIdRequest, res: Response) {
  try {
    const body = req.body

    const serviceTicketHistoryId = req.params.serviceTicketHistoryId
    const serviceTicketHistory = await ServiceTicketHistory.findById(serviceTicketHistoryId)
    if(!serviceTicketHistory) {
      res.status(404).json({ message: '`Service Ticket` not found' })
      return
    }

    serviceTicketHistory.serviceTicket = body.serviceTicket
    serviceTicketHistory.date = body.date
    serviceTicketHistory.time = body.time
    serviceTicketHistory.details = body.details
    serviceTicketHistory.remarks = body.remarks
    serviceTicketHistory.updatedBy = new Types.ObjectId(req.userId)

    await serviceTicketHistory.save()
    res.status(200).json(serviceTicketHistory)
  }
  catch(error) {
    console.error(`Error [updateserviceTicketHistory]: ${error}`)
    res.status(400).json(error)
  }
}


export async function removeServiceTicketHistory(req: Request, res: Response) {
  try {
    const serviceTicketId = req.params.serviceTicketId
    const deleted = await ServiceTicketHistory.findByIdAndDelete(serviceTicketId)
    
    if(deleted) {
      res.status(204).json({})
    }
    else {
      res.status(500).json({message: 'Error [removeServiceTicketHistory]: Something went wrong.'})
    }
  }
  catch(error) {
    console.error(`Error [removeServiceTicketHistory]: ${error}`)
    res.status(400).json(error)
  }
}
