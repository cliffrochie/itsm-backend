import { Request, Response } from "express-serve-static-core";
import { IOfficeBody, IOfficeFilter, IOfficeQueryParams, IOfficeResults } from "../@types/IOffice";
import sorter from "../utils/sorter";
import Office from "../models/Office";
import { IUserIdRequest } from "../@types/IUser";
import User from "../models/User";
import { Types } from "mongoose";



export async function getOffices(req: Request<{}, {}, {}, IOfficeQueryParams>, res: Response) {
  try {
    const { name, alias, officeType, includes, noPage } = req.query
    const filter: IOfficeFilter = {}
    const sortResult = await sorter(req.query.sort)

    if(name) filter.name = { $regex: name + '.*', $options: 'i' }
    if(alias) filter.alias = { $regex: alias + '.*', $options: 'i' }
    if(officeType) filter.officeType = { $regex: officeType + '.*', $options: 'i' }

    const page: number = Number(req.query.page) || 1
    const limit: number = req.query.limit || 10
    const skip: number = (page - 1) * limit
    

    let offices = []

    if(noPage) {
      if(includes === 'parentOffice') {
        offices = await Office.find(filter).populate('parentOffice').sort(sortResult)
      }
      else {
        offices = await Office.find(filter).sort(sortResult)
      }

      res.json(offices)
      return
    }

    if(includes === 'parentOffice') {
      offices = await Office.find(filter).populate('parentOffice').sort(sortResult).skip(skip).limit(limit)
    }
    else {
      offices = await Office.find(filter).sort(sortResult).skip(skip).limit(limit)
    }

    const total = await Office.find(filter).countDocuments()

    const results: IOfficeResults = { results: offices, page, totalPages: Math.ceil(total / limit), total }
    res.json(results)
  }
  catch(error) {
    console.error(`Error [getOffices]: ${error}`)
    res.status(400).json(error)
  }
}


export async function getOffice(req: Request, res: Response) {
  try {
    const officeId = req.params.officeId
    const office = await Office.findById(officeId)
    
    if(!office) {
      res.status(404).json({ message: '`Office` not found' })
      return
    }
    
    res.json(office)
  }
  catch(error) {
    console.error(`Error [getOffice]: ${error}`)
    res.status(400).json(error)
  }
}


export async function createOffice(req: IUserIdRequest, res: Response) {
  try {
    const body: IOfficeBody = req.body
    
    const office = new Office({
      name: body.name,
      alias: body.alias,
      officeType: body.officeType,
      parentOffice: body.parentOffice ? new Types.ObjectId(body.parentOffice) : undefined,
      createdBy: new Types.ObjectId(req.userId)
    })

    await office.save()
    res.status(201).json(office)
  }
  catch(error) {
    console.error(`Error [createOffice]: ${error}`)
    res.status(400).json(error)
  }
}


export async function updateOffice(req: IUserIdRequest, res: Response) {
  try {
    const body: IOfficeBody = req.body
    const officeId = req.params.officeId

    const office = await Office.findById(officeId)
    if(!office) {
      res.status(404).json({ message: '`Office` not found' })
      return
    }

    office.name = body.name
    office.alias = body.alias
    office.officeType = body.officeType
    office.parentOffice = body.parentOffice ? new Types.ObjectId(body.parentOffice) : undefined
    office.updatedBy = new Types.ObjectId(req.userId)
    
    await office.save()
    res.json(office)
  }
  catch(error) {
    console.error(`Error [updateOffice]: ${error}`)
    res.status(400).json(error)
  }
}


export async function removeOffice(req: Request, res: Response) {
  try {
    const officeId = req.params.officeId
    await Office.findByIdAndDelete(officeId)
    res.status(204).json({})
  }
  catch(error) {
    console.error(`Error [removeOffice]: ${error}`)
    res.status(400).json(error)
  }
}

