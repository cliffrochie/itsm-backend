import { Router } from "express";
import auth from "../middlewares/auth";
import serviceTicketLogger from "../middlewares/service-ticket-history";
import { 
  createServiceTicket, 
  getGeneratedTicketNo, 
  getServiceTicket, 
  getServiceTickets, 
  updateServiceTicket,
  removeServiceTicket, 
  updateServiceStatus,  
} from "../controllers/serviceTicketController";


const router = Router()

router.get('/', getServiceTickets)
router.get('/generate', getGeneratedTicketNo)
router.get('/:serviceTicketId', getServiceTicket)
router.post('/', serviceTicketLogger, createServiceTicket)
router.put('/:serviceTicketId', serviceTicketLogger, updateServiceTicket)
router.put('/:serviceTicketId/update-service-status', serviceTicketLogger, updateServiceStatus)
router.delete('/:serviceTicketId', removeServiceTicket)


export default router