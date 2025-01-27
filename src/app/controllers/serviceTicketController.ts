import { Request, Response } from "express-serve-static-core";
import { IServiceTicketBody, IServiceTicketFilter, IServiceTicketQueryParams, IServiceTicketResults } from "../@types/IServiceTicket";
import sorter from "../utils/sorter";
import ServiceTicket from "../models/ServiceTicket";
import { IUserIdRequest } from "../@types/IUser";
import { Types } from "mongoose";
import { capitalizeFirstLetter, generateTicketNo } from "../utils";
import User from "../models/User";


interface LogRequest extends IUserIdRequest {
  logDetails?: string
}


export async function getServiceTickets(req: Request<{}, {}, {}, IServiceTicketQueryParams>, res: Response) {
  try {
    const {
      ticketNo, 
      date,
      time,
      taskType,
      natureOfWork,
      serialNo,
      equipmentType,
      defectsFound,
      serviceRendered,
      serviceStatus,
      priority,
      remarks,
      sort,
      includes,
      noPage,
      client,
      serviceEngineer
    } = req.query

    console.log(req.query)

    const filter: IServiceTicketFilter = {}
    const sortResult = await sorter(sort)

    if(ticketNo) filter.ticketNo = { $regex: ticketNo + '.*', $options: 'i' }
    if(date) filter.date = { $regex: date + '.*', $options: 'i' }
    if(time) filter.time = { $regex: time + '.*', $options: 'i' }
    if(taskType) filter.taskType = { $regex: taskType + '.*', $options: 'i' }
    if(natureOfWork) filter.natureOfWork = { $regex: natureOfWork + '.*', $options: 'i' }
    if(serialNo) filter.serialNo = { $regex: serialNo + '.*', $options: 'i' }
    if(equipmentType) filter.equipmentType = { $regex: equipmentType + '.*', $options: 'i' }
    if(defectsFound) filter.defectsFound = { $regex: defectsFound + '.*', $options: 'i' }
    if(serviceRendered) filter.serviceRendered = { $regex: serviceRendered + '.*', $options: 'i' }
    if(serviceStatus) filter.serviceStatus = { $regex: serviceStatus + '.*', $options: 'i' }
    if(priority) filter.priority = { $regex: priority + '.*', $options: 'i' }
    if(remarks) filter.remarks = { $regex: remarks + '.*', $options: 'i' }

    const clientFilter = client
      ? { $or: [{firstName: {$regex: client, $options: 'i'}}, {lastName: {$regex: client, $options: 'i'}}] }
      : {}
 
    const serviceEngineerFilter = serviceEngineer
      ? { $or: [{firstName: {$regex: serviceEngineer, $options: 'i'}}, {lastName: {$regex: serviceEngineer, $options: 'i'}}] }
      : {}


    const page: number = Number(req.query.page) || 1
    const limit: number = req.query.limit || 10
    const skip: number = (page - 1) * limit

    let serviceTickets = []
    let filteredServiceTickets = []

    if(noPage) {
      serviceTickets = await ServiceTicket.find(filter).sort(sortResult)
      res.json(serviceTickets)
      return
    }

    if(includes === 'all') {
      serviceTickets = await ServiceTicket
        .find(filter)
        .populate({
          path: 'serviceEngineer',
          match: serviceEngineerFilter
        })
        .populate({
          path: 'client',
          match: clientFilter
        })
        .sort(sortResult)
        .skip(skip)
        .limit(limit)
    }
    else if(includes === 'serviceEngineer') {
      serviceTickets = await ServiceTicket
        .find(filter)
        .populate({
          path: 'serviceEngineer',
          match: serviceEngineerFilter
        })
        .sort(sortResult)
        .skip(skip)
        .limit(limit)
    }
    else if(includes === 'client') {
      serviceTickets = await ServiceTicket
        .find(filter)
        .populate({
          path: 'client',
          match: clientFilter
        })
        .sort(sortResult)
        .skip(skip)
        .limit(limit)
    }
    else {
      serviceTickets = await ServiceTicket
        .find(filter)
        .sort(sortResult)
        .skip(skip)
        .limit(limit)
    }


    filteredServiceTickets = serviceTickets.filter(serviceTicket => {
      const hasMatchingOffice = client ? serviceTicket.client : true
      const hasMatchingDesignation = serviceEngineer ? serviceTicket.serviceEngineer : true
      return hasMatchingOffice && hasMatchingDesignation        
    })

    console.log(filteredServiceTickets)
    console.log('----')
    console.log(serviceTickets)
 
    const total = await ServiceTicket
      .find(filter)
      .countDocuments()

    const results: IServiceTicketResults = { results: filteredServiceTickets, page, totalPages: Math.ceil(total / limit), total }
    res.json(results)
  }
  catch(error) {
    console.error(`Error [getServiceTickets]: ${error}`)
    res.status(400).json(error)
  }
}

export async function getServiceTicket(req: Request, res: Response) {
  try {
    const serviceTicketId = req.params.serviceTicketId
    const serviceTicket = await ServiceTicket.findById(serviceTicketId).populate('client').populate('serviceEngineer')
    
    if(!serviceTicket) {
      res.status(404).json({ message: '`ServiceTicket` not found' })
      return
    }
    else {
      res.json(serviceTicket)
    }
  }
  catch(error) {
    console.error(`Error [getServiceTicket]: ${error}`)
    res.status(400).json(error)
  }
}

export async function getGeneratedTicketNo(req: Request, res: Response) {
  try {
    console.log('----')
    const ticket = await generateTicketNo('01/21/2025')
    console.log(ticket)
    res.json({ ticket: ticket })
  }
  catch(error) {
    console.error(`Error [getGeneratedTicketNo]: ${error}`)
    res.status(400).json(error)
  }
}


export async function createServiceTicket(req: IUserIdRequest, res: Response) {
  try {
    const body: IServiceTicketBody = req.body
    const ticket = await generateTicketNo(body.date)

    const serviceTicket = new ServiceTicket({
      ticketNo: ticket,
      date: body.date,
      time: body.time,
      taskType: body.taskType,
      natureOfWork: body.natureOfWork,
      serialNo: body.serialNo,
      equipmentType: body.equipmentType,
      defectsFound: body.defectsFound,
      serviceRendered: body.serviceRendered,
      serviceStatus: body.serviceStatus,
      priority: body.priority,
      remarks: body.remarks,
      serviceEngineer: body.serviceEngineer ? new Types.ObjectId(body.serviceEngineer) : undefined,
      client: body.client ? new Types.ObjectId(body.client) : undefined,
      createdBy: new Types.ObjectId(req.userId),
    })
    await serviceTicket.save()
    res.status(201).json(serviceTicket)
  }
  catch(error) {
    console.error(`Error [createServiceTicket]: ${error}`)
    res.status(400).json(error)
  }
}

export async function updateServiceTicket(req: LogRequest, res: Response) {
  try {
    const body: IServiceTicketBody = req.body

    const serviceTicketId = req.params.serviceTicketId
    const serviceTicket = await ServiceTicket.findById(serviceTicketId)
    if(!serviceTicket) {
      res.status(404).json({ message: '`Service Ticket` not found' })
      return
    }

    
    // Update Service Status
    if(serviceTicket.serviceStatus !== body.serviceStatus) {
      req.logDetails = `Service status is updated from ${serviceTicket.serviceStatus} to ${body.serviceStatus}`
    }

    // Escalate Problem
    if((serviceTicket.serviceEngineer !== null || serviceTicket.serviceEngineer !== undefined) 
        && 
        serviceTicket.serviceEngineer !== body.serviceEngineer
      ) {

      const newServiceEngineer = await User.findById(req.body.serviceEngineer)
      if(!newServiceEngineer) {
        res.status(404).json({ message: '`Service Engineer` not found'})
        return
      }

      const oldServiceEngineer = await User.findById(serviceTicket.serviceEngineer)
      if(!oldServiceEngineer) {
        res.status(404).json({ message: '`Service Engineer` not found'})
        return
      }
      
      const oldFullName = capitalizeFirstLetter(oldServiceEngineer.firstName) +' '+ capitalizeFirstLetter(oldServiceEngineer.lastName)
      const newFullName = capitalizeFirstLetter(newServiceEngineer.firstName) +' '+ capitalizeFirstLetter(newServiceEngineer.lastName)

      req.logDetails = `Service is escalted from ${oldFullName} to ${newFullName} with  ${capitalizeFirstLetter(body.priority)} priority level.`
    }

    // Assign Service Engineer
    if((serviceTicket.serviceEngineer !== null || serviceTicket.serviceEngineer !== undefined) 
      &&
      (body.serviceEngineer !== null || body.serviceEngineer !== undefined || body.serviceEngineer !== '')
    ) {
      const newServiceEngineer = await User.findById(req.body.serviceEngineer)
      if(!newServiceEngineer) {
        res.status(404).json({ message: '`Service Engineer` not found'})
        return
      }
      const newFullName = capitalizeFirstLetter(newServiceEngineer.firstName) +' '+ capitalizeFirstLetter(newServiceEngineer.lastName)

      req.logDetails = `Service is assigned to ${newFullName} with ${capitalizeFirstLetter(body.priority)} priority level.`
    }

    serviceTicket.ticketNo = body.ticketNo
    serviceTicket.date = body.date
    serviceTicket.time = body.time
    serviceTicket.taskType = body.taskType
    serviceTicket.natureOfWork = body.natureOfWork
    serviceTicket.serialNo = body.serialNo
    serviceTicket.equipmentType = body.equipmentType
    serviceTicket.defectsFound = body.defectsFound
    serviceTicket.serviceRendered = body.serviceRendered
    serviceTicket.serviceStatus = body.serviceStatus
    serviceTicket.priority = body.priority
    serviceTicket.remarks = body.remarks
    serviceTicket.serviceEngineer = body.serviceEngineer ? new Types.ObjectId(body.serviceEngineer) : undefined
    serviceTicket.client = body.client ? new Types.ObjectId(body.client) : undefined
    serviceTicket.updatedBy = new Types.ObjectId(req.userId)

    await serviceTicket.save()
    res.status(200).json(serviceTicket)
  }
  catch(error) {
    console.error(`Error [updateServiceTicket]: ${error}`)
    res.status(400).json(error)
  }
}


export async function removeServiceTicket(req: Request, res: Response) {
  try {
    const serviceTicketId = req.params.serviceTicketId
    const deleted = await ServiceTicket.findByIdAndDelete(serviceTicketId)
    
    if(deleted) {
      res.status(204).json({})
    }
    else {
      res.status(500).json({message: 'Error [removeServiceTicket]: Something went wrong.'})
    }
  }
  catch(error) {
    console.error(`Error [removeServiceTicket]: ${error}`)
    res.status(400).json(error)
  }
}


// export async function assignServiceEngineer(req: Request, res: Response) {
//   try {
//     const serviceTicketId = req.params.serviceTicketId
//     const serviceTicket = await ServiceTicket.findById(serviceTicketId)
//     if(!serviceTicket) {
//       res.status(404).json({ message: '`Service Ticket` not found' })
//       return
//     }


//   }
//   catch(error) {
//     console.error(`Error [assignServiceEngineer]: ${error}`)
//     res.status(400).json(error)
//   }
// }


// export async function escalateServiceTicket(req: Request, res: Response) {
//   try {
//     const serviceTicketId = req.params.serviceTicketId
//     const serviceTicket = await ServiceTicket.findById(serviceTicketId)
//     if(!serviceTicket) {
//       res.status(404).json({ message: '`Service Ticket` not found' })
//       return
//     }

//     // req.logDetails = `Escalated the problem to ${req.body}`
//   }
//   catch(error) {
//     console.error(`Error [escalateServiceTicket]: ${error}`)
//     res.status(400).json(error)
//   }
// }


// export async function updateServiceStatus(req: Request, res: Response) {
//   try {
//     const serviceTicketId = req.params.serviceTicketId
//     const serviceTicket = await ServiceTicket.findById(serviceTicketId)
//     if(!serviceTicket) {
//       res.status(404).json({ message: '`Service Ticket` not found' })
//       return
//     }


//   }
//   catch(error) {
//     console.error(`Error [escalateServiceTicket]: ${error}`)
//     res.status(400).json(error)
//   }
// }