import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express-serve-static-core'
import { JwtPayload } from '../@types/IJWTPayload'
import { IUserRequest } from '../@types/IUser'

dotenv.config()


export default function(req: IUserRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies.token
    // console.log(token)

    if(!jwt.verify(token, String(process.env.SECRET_KEY) || 'notsosecret')) {
      res.status(403).json({ message: 'Invalid token 1' })  
      return
    }

    const payload = jwt.decode(token) as JwtPayload
    // console.log('#####')
    // console.log(payload)

    if(!payload) {
      res.status(403).json({ message: 'Invalid token 2' })
      return
    }

    req.userId = payload.userId
    next()
  }

  catch(error) {
    res.clearCookie('token')
    console.error(`Error [auth]: ${error}`)
    res.status(403).json({ message: 'Invalid token 3'})
    return
  }
}