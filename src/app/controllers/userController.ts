import jwt from 'jsonwebtoken'
import { Request, Response } from "express-serve-static-core";
import User from "../models/User";
import sorter from '../utils/sorter';
import { IUser, IUserFilter, IUserIdRequest, IUserQueryParams, IUserResults } from '../@types/IUser';


export async function userSignIn(req: Request, res: Response) {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if(!user) {
      res.status(404).json({ message: 'Invalid credentials!' })
      return
    }
    if(!user.comparePassword(password)) { 
      res.status(404).json({ message: 'Invalid credentials!!' })
      return
    }
    const token = jwt.sign({userId: user._id}, process.env.SECRET_KEY || 'notsosecret', {expiresIn: '1h'})

    res.cookie('jwt', token, {
      httpOnly: true,             // Prevent JavaScript access
      secure: false,              // Use HTTPS in production
      sameSite: 'strict',         // Protect against CSRF
      maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
    })
    res.json({ message: 'Login successful' })
  }
  catch(error) {
    console.error(`Error [userSignIn]: ${error}`)
    res.status(400).json(error)
  }
}


export async function userSignUp(req: Request, res: Response) {
  try {
    const body = req.body
    const user = new User(body)
    await user.save()
    const token = jwt.sign({userId: user._id}, process.env.SECRET_KEY || 'notsosecret', {expiresIn: '1h'})
    res.status(201).json({ token })
  }
  catch(error) {
    console.error(`Error [userSignUp]: ${error}`)
    res.status(400).json(error)
  }
}


export async function getCurrentUser(req: IUserIdRequest, res: Response) {
  try {
    const userId = req.userId
    const user = await User.findById(userId).select('-password')
    if(!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  }
  catch(error) {
    console.error(`Error [getCurrentUser]: ${error}`)
    res.status(400).json(error)
  }
}


export async function getUsers(req: Request<{}, {}, {}, IUserQueryParams>, res: Response) {
  try {
    const { firstName, middleName, lastName, username, email, extensionName, role, noPage } = req.query
    const filter: IUserFilter = {}
    const sortResult = await sorter(req.query.sort)

    if(firstName) filter.firstName = { $regex: firstName + '.*', $options: 'i' }
    if(middleName) filter.middleName = { $regex: middleName + '.*', $options: 'i' }
    if(lastName) filter.lastName = { $regex: lastName + '.*', $options: 'i' }
    if(username) filter.username = { $regex: username + '.*', $options: 'i' }
    if(email) filter.email = { $regex: email + '.*', $options: 'i' }
    if(extensionName) filter.extensionName = { $regex: extensionName + '.*', $options: 'i' }
    if(role) filter.role = { $regex: role + '.*', $options: 'i' }

    const page: number = Number(req.query.page) || 1
    const limit: number = req.query.limit || 10
    const skip: number = (page - 1) * limit

    let users = []

    if(noPage) {
      users = await User.find(filter).select('-password').sort(sortResult)
      res.json(users)
      return
    }

    users = await User.find(filter).select('-password').sort(sortResult).skip(skip).limit(limit)
    const total = await User.find(filter).countDocuments()
    // const total = users.length

    const results: IUserResults = { results: users, page, totalPages: Math.ceil(total / limit), total }
    res.json(results)
  }
  catch(error) {
    console.error(`Error [getUsers]: ${error}`)
    res.status(400).json(error)
  }
}


export async function getUser(req: Request, res: Response) {
  try {
    const user: IUser = await User.findById(req.params.id).select('-password')

    if(!user) { res.status(404).json({messsage: 'User not found'}); return }
    res.json(user)
  }
  catch(error) {
    console.error(`Error [getUserById]: ${error}`)
    res.status(400).json(error)
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const user: IUser = await User.findById(req.params.id).select('-password')

    if(!user) { res.status(404).json({messsage: 'User not found'}); return }

    user.avatar = req.body.avatar
    user.username = req.body.username
    user.email = req.body.email
    user.firstName = req.body.firstName
    user.middleName = req.body.middleName
    user.lastName = req.body.lastName
    user.extensionName = req.body.extensionName
    user.contactNo = req.body.contactNo
    user.email = req.body.email
    user.role = req.body.role
    user.save()
    
    res.json(user)
  }
  catch(error) {
    console.error(`Error [getUserById]: ${error}`)
    res.status(400).json(error)
  }
}