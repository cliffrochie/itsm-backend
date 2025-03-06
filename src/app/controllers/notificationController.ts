import { Request, Response } from "express-serve-static-core";
import sorter from "../utils/sorter";
import { Types } from "mongoose";
import { ITicketCounter, ITicketCounterQueryParams, ITicketCounterFilter, ITicketCounterBody, ITicketCounterResults } from "../@types/ITicketCounter";
import TicketCounter from "../models/TicketCounter";
import { IUserRequest } from "../@types/IUser";
import { INotificationFilter, INotificationQueryParams } from "../@types/INotification";
import Notification from "../models/Notification";




export async function getNotifications(req: Request<{}, {}, {}, INotificationQueryParams>, res: Response) {
  try {
    const { userId, isRead, noPage } = req.query
    const filter: INotificationFilter = {}
    const sortResult = await sorter(req.query.sort)
    
    const user = new Types.ObjectId(userId)
    console.log(`${userId} : ${user}`)

    filter.user = user
    if(isRead) filter.isRead = isRead

    const page: number = Number(req.query.page)  || 1
    const limit: number = req.query.limit || 5
    const skip: number = (page - 1) * limit

    let notifications = []

    if(noPage) {
      notifications = await Notification.find(filter).sort(sortResult)
      res.json(notifications)
      return
    }

    notifications = await Notification.find(filter).sort(sortResult).skip(skip).limit(limit)
    const total = await Notification.find(filter).countDocuments()

    const results = { results: notifications, page, totalPages: Math.ceil(total / limit), total }
    res.json(results)
  }
  catch(error) {
    console.error(`Error [getNotifications]: ${error}`)
    res.status(400).json(error)
  }
}



export async function getNotification(req: Request, res: Response) {
  try {
    const notificationId = req.params.notificationId
    const notification = await Notification.findById(notificationId)
    if(!notification) {
      res.status(404).json({ message: '`Notification` not found' })
      return
    } 

    res.json(notification)
  }
  catch(error) {
    console.error(`Error [getNotification]: ${error}`)
    res.status(400).json(error)
  }
}



export async function notificationIsBeingRead(req: Request, res: Response) {
  try {
    const notificationId = req.params.notificationId
    const notification = await Notification.findById(notificationId)
    if(!notification) {
      res.status(404).json({ message: '`Notification` not found' })
      return
    } 

    notification.isRead = true
    const done = await notification.save()
    if(!done) {
      res.status(400).json({ message: 'Something went wrong when updating the notification'})
    }

    res.json({})
  }
  catch(error) {
    console.error(`Error [updateNotification]: ${error}`)
    res.status(400).json(error)
  }
}