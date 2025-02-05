import { Request, Response } from "express-serve-static-core";
import Designation from '../models/Designation';
import sorter from '../utils/sorter';
import { IDesignation, IDesignationBody, IDesignationFilter, IDesignationQueryParams, IDesignationResults } from '../@types/IDesignation';
import { IUserRequest } from '../@types/IUser';
import User from "../models/User";
import { Types } from "mongoose";


export async function getDesignations(req: Request<{}, {}, {}, IDesignationQueryParams>, res: Response) {
  try {
    const { title, sort, noPage } = req.query
    const filter: IDesignationFilter = {}
    const sortResult = await sorter(req.query.sort)

    if(title) filter.title = { $regex: title + '.*', $options: 'i' }

    const page: number = Number(req.query.page)  || 1
    const limit: number = req.query.limit || 10
    const skip: number = (page - 1) * limit

    let designations = []

    if(noPage) {
      designations = await Designation.find(filter).sort(sortResult)
      res.json(designations)
      return
    }

    designations = await Designation.find(filter).sort(sortResult).skip(skip).limit(limit)
    const total = await Designation.find(filter).countDocuments()

    const results: IDesignationResults = { results: designations, page, totalPages: Math.ceil(total / limit), total }
    res.json(results)
  }
  catch(error) {
    console.error(`Error [getDesignations]: ${error}`)
    res.status(400).json(error)
  }
}


export async function getDesignation(req: Request, res: Response) {
  try {
    const designationId = req.params.designationId
    const designation = await Designation.findById(designationId)
    if(!designation) {
      res.status(404).json({ message: '`Designation` not found' })
      return
    }
    res.json(designation)
  }
  catch(error) {
    console.error(`Error [getDesignation]: ${error}`)
    res.json({ message: '[getDesignation] Server error', details: error })
  }
}


export async function createDesignation(req: IUserRequest, res: Response) {
  try {
    const body: IDesignationBody = req.body

    const designation = new Designation({
      title: body.title,
      createdBy: req.userId ? new Types.ObjectId(req.userId) : undefined
    })
    
    await designation.save()
    res.status(201).json(designation)
  }
  catch(error) {
    console.error(`Error [createDesignation]: ${error}`)
    res.status(400).json(error)
  }
}


export async function updateDesignation(req: IUserRequest, res: Response) {
  try {
    const body: IDesignationBody = req.body
    const designationId = req.params.designationId

    const designation = await Designation.findById(designationId)
    if(!designation) {
      res.status(404).json({ message: '`Designation` not found' })
      return
    }

    designation.title = body.title
    designation.updatedBy = req.userId ? new Types.ObjectId(req.userId) : undefined

    await designation.save()
    res.json(designation)
  }
  catch(error) {
    console.error(`Error [updateDesignation]: ${error}`)
    res.status(400).json(error)
  }
}


export async function removeDesignation(req: Request, res: Response) {
  try {
    const designationId = req.params.designationId
    const deleted = await Designation.findByIdAndDelete(designationId)

    if(deleted) {
      res.status(204).json({})
    }
    else {
      res.status(500).json({message: 'Error [removeDesignation]: Something went wrong.'})
    }
  }
  catch(error) {
    console.error(`Error [removeDesignation]: ${error}`)
    res.status(400).json(error)
  }
}