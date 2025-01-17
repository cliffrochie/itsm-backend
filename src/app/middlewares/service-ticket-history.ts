import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express-serve-static-core'
import { IUserIdRequest } from '../@types/IUser'

dotenv.config()


export default function(req: IUserIdRequest, res: Response, next: NextFunction) {
  try {
    

    next()
  }

  catch(error) {
    console.error(`Error [auth]: ${error}`)
    res.status(403).json({ message: 'Invalid token'})
    return
  }
}