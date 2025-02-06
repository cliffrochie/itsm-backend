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
  assignServiceEngineer,
  escalateService,
  getTotalTickets,
} from "../controllers/serviceTicketController";


const router = Router()

router.get('/', auth, getServiceTickets)
router.get('/generate', auth, getGeneratedTicketNo)
router.get('/total', getTotalTickets)
router.get('/:serviceTicketId', auth, getServiceTicket)
router.post('/', auth, serviceTicketLogger, createServiceTicket)
router.put('/:serviceTicketId', auth, serviceTicketLogger, updateServiceTicket)
router.patch('/:serviceTicketId/update-service-status', auth, serviceTicketLogger, updateServiceStatus)
router.patch('/:serviceTicketId/assign-service-engineer', auth, serviceTicketLogger, assignServiceEngineer)
router.patch('/:serviceTicketId/escalate-service', auth, serviceTicketLogger, escalateService)
router.delete('/:serviceTicketId', auth, removeServiceTicket)


export default router