import { Request, Response, NextFunction } from 'express-serve-static-core'
import ActionLog from '../models/ActionLog'

interface AuthenticatedRequest extends Request {
  userId?: string
}


const logMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.on('finish', async () => {
    try {
      const logEntry = new ActionLog({
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        userId: req.userId ? req.userId : 'guest',
        ip: req.ip,
        body: req.body,
        query: req.query,
        params: req.params,
        timestamp: new Date()
      })

      await logEntry.save()
    }
    catch(err) {
      console.error('Error saving action log: ', err)
    }
  })

  next()
}

export default logMiddleware