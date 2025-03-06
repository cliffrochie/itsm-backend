import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express-serve-static-core'
import { JwtPayload } from '../../types/query-params'
import { IUserRequest } from '../@types/IUser'

dotenv.config()


export default function(req: IUserRequest, res: Response, next: NextFunction) {
  try {
    // // Authorization: 'Bearer token'
    // const authHeader = req.headers.authorization
    // if(!authHeader || !authHeader.startsWith('Bearer ')) {
    //   res.status(401).json({ message: 'User unauthorized' })
    //   return
    // }
    // const token = authHeader.split(' ')[1]

    const token = req.cookies.token
    // console.log(token)

    if(!jwt.verify(token, String(process.env.SECRET_KEY) || 'notsosecret')) {
      res.status(403).json({ message: 'Invalid token 1' })  
      return
    }

    const payload = jwt.decode(token) as JwtPayload

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