import { Request, Response, NextFunction } from 'express-serve-static-core'
import { actionInterpretation } from '../utils'
import ServiceTicketHistory from '../models/ServiceTicketHistory'
import { Types } from 'mongoose'
import { changeDateFormatMMDDYYYY } from '../utils'
import { IUserIdRequest } from '../@types/IUser'


interface LogRequest extends IUserIdRequest {
  logDetails?: string
}

export default async function serviceTicketLogger(req: LogRequest, res: Response, next: NextFunction) {
  res.on('finish', async () => {
    try { 
      const action = actionInterpretation(req.method)
      const log = new ServiceTicketHistory({
        createdBy: new Types.ObjectId(req.userId),
        createdAt: new Date(),
        date: changeDateFormatMMDDYYYY(new Date()),
        time: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true}),
        action: action,
        details: req.logDetails ? req.logDetails : 'No details provided.'      
      })
      await log.save()
  
    }
    catch(error) {
      console.error(`Error [serviceTicketLogger]: ${error}`)
      res.status(403).json({ message: `Something went wrong: ${error}`})
      return
    }
  })

  next()
}