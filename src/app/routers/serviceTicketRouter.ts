import { Router } from "express";
import auth from "../middlewares/auth";
import { createServiceTicket, getServiceTicket, getServiceTickets, removeServiceTicket, updateServiceTicket } from "../controllers/serviceTicketController";


const router = Router()

router.get('/', getServiceTickets)
router.get('/:serviceTicketId', getServiceTicket)
router.post('/', createServiceTicket)
router.put('/:serviceTicketId', updateServiceTicket)
router.delete('/:serviceTicketId', removeServiceTicket)

export default router