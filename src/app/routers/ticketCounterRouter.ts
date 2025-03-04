import { Router } from "express";
import auth from "../middlewares/auth";
import { 
  getTicketCounters, 
  getTicketCounter, 
  createTicketCounter, 
  updateTicketCounter, 
  removeTicketCounter 
} from "../controllers/ticketCounterController";

const router = Router()

router.get('/', auth, getTicketCounters)
router.get('/:ticketCounterId', auth, getTicketCounter)
router.post('/', auth, createTicketCounter)
router.put('/:ticketCounterId', auth, updateTicketCounter)
router.delete('/:ticketCounterId', auth, removeTicketCounter)

export default router