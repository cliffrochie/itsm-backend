import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Express, Request, Response } from 'express-serve-static-core'

import database from './config/database'
import userRouter from './app/routers/userRouter'
import designationRouter from './app/routers/designationRouter'
import officeRouter from './app/routers/officeRouter'
import clientRouter from './app/routers/clientRouter'
import serviceTicketRouter from './app/routers/serviceTicketRouter'
import serviceTicketHistory from './app/routers/serviceTicketHistoryRouter'
import logMiddleware from './app/middlewares/action-log'


export function createApp() {
  dotenv.config()
  database()

  const app: Express = express()
  app.use(cors({ 
    origin: 'http://localhost:3500',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
  }))
  app.use(cookieParser())
  app.use(express.json())
  app.use(logMiddleware)
  app.use('/api/users', userRouter)
  app.use('/api/designations', designationRouter)
  app.use('/api/offices', officeRouter)
  app.use('/api/clients', clientRouter)
  app.use('/api/service-tickets', serviceTicketRouter)
  app.use('/api/service-ticket-histories', serviceTicketHistory)

  app.get('/', async (req: Request, res: Response) => {
    res.json({ message: 'hello it service ticket' })
  })

  return app
}