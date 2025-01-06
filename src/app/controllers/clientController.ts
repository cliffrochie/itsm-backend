import { Request, Response } from "express-serve-static-core";
import { IClientBody, IClientFilter, IClientQueryParams, IClientResults } from "../@types/IClient";
import sorter from "../utils/sorter";
import Client from "../models/Client";
import { IUserIdRequest } from "../@types/IUser";
import User from "../models/User";
import Designation from "../models/Designation";
import Office from "../models/Office";
import { Types } from "mongoose";


async function getDesignation(filter: any) {
  const result = await Designation.find({_id: filter._id})
  return result[0]
}

async function getOffice(filter: any) {
  const result = await Office.find({_id: filter._id})
  return result[0]
}


export async function getClients(req: Request<{}, {}, {}, IClientQueryParams>, res: Response) {
  try {
    const { firstName, lastName, includes, sort, noPage } = req.query

    const filter: IClientFilter = {}
    const sortResult = await sorter(sort)

    if(firstName) filter.firstName = { $regex: firstName + '.*', $options: 'i' }
    if(lastName) filter.lastName = { $regex: lastName + '.*', $options: 'i' }

    const page: number = Number(req.query.page) || 1
    const limit: number = req.query.limit || 10
    const skip: number = (page - 1) * limit

    let clients = []

    if(noPage) {
      if(includes === 'all') {
        clients = await Client.find(filter).populate('designation').populate('office').sort(sortResult)
      }
      else {
        clients = await Client.find(filter).sort(sortResult)
      }
  
      res.json(clients)
      return
    }
    
    if(includes === 'all') {
      clients = await Client.find(filter).populate('designation').populate('office').sort(sortResult).skip(skip).limit(limit)
    }
    else {
      clients = await Client.find(filter).sort(sortResult).skip(skip).limit(limit)
    }

    const total = await Client.find(filter).countDocuments()

    const results: IClientResults = { results: clients, page, totalPages: Math.ceil(total / limit), total }
    res.json(results)
    
  } 
  catch(error) {
    console.error(`Error [getClients]: ${error}`)
    res.status(400).json(error)
  }
}


export async function getClient(req: Request, res: Response) {
  try {
    const clientId = req.params.clientId
    const client = await Client.findById(clientId)
    if(!client) {
      res.status(404).json({ message: '`Client` not found' })
    }
    else {
      res.json(client)
    }
  }
  catch(error) {
    console.error(`Error [getClient]: ${error}`)
    res.status(400).json(error)
  }
}


export async function createClient(req: IUserIdRequest, res: Response) {
  try {
    const body: IClientBody = req.body

    const client = new Client({
      user: body.user ? new Types.ObjectId(body.user) : undefined,
      firstName: body.firstName,
      middleName: body.middleName,
      lastName: body.lastName,
      extensionName: body.extensionName,
      designation: body.designation ? new Types.ObjectId(body.designation) : undefined, 
      office: body.office ? new Types.ObjectId(body.office): undefined,
      createdBy: new Types.ObjectId(req.userId)
    })

    await client.save()
    res.status(201).json(client)
  } 
  catch(error) {
    console.error(`Error [createClient]: ${error}`)
    res.status(400).json(error)
  }
}


export async function updateClient(req: IUserIdRequest, res: Response) {
  try {
    const body: IClientBody = req.body

    const clientId = req.params.clientId
    const client = await Client.findById(clientId)
    if(!client) {
      res.status(404).json({ message: '`Office` not found' })
      return
    }
    
    client.user = body.user ? new Types.ObjectId(body.user) : undefined
    client.firstName = body.firstName
    client.middleName = body.middleName
    client.lastName = body.lastName
    client.extensionName = body.extensionName
    client.designation = body.designation ? new Types.ObjectId(body.designation): undefined
    client.office = body.office ? new Types.ObjectId(body.office) : undefined
    client.updatedBy = new Types.ObjectId(req.userId)
    
    await client.save()
    res.json(client)
  }
  catch(error) {
    console.error(`Error [updateClient]: ${error}`)
    res.status(400).json(error)
  }
}

export async function removeClient(req: Request, res: Response) {
  try {
    const clientId = req.params.clientId
    Client.findByIdAndDelete(clientId)
    res.status(204).json({})
  }
  catch(error) {
    console.error(`Error [removeClient]: ${error}`)
    res.status(400).json(error)
  }
}