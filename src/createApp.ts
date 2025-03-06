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
import serviceTicketHistoryRouter from './app/routers/serviceTicketHistoryRouter'
import ticketCounterRouter from './app/routers/ticketCounterRouter'
import notificationRouter from './app/routers/notificationRouter'
import logMiddleware from './app/middlewares/action-log'


export function createApp() {
  dotenv.config()
  database()

  const app: Express = express()
  app.use(cors({ 
    origin: 'http://192.168.2.254:3500',
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
  app.use('/api/service-ticket-histories', serviceTicketHistoryRouter)
  app.use('/api/ticket-counters', ticketCounterRouter)
  app.use('/api/notifications', notificationRouter)

  app.get('/', async (req: Request, res: Response) => {
    res.json({ message: 'hello it service ticket' })
  })

  return app
}