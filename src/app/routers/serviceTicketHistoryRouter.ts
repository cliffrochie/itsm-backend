import { Router } from "express";
import auth from "../middlewares/auth";
import { 
  createServiceTicketHistory, 
  getServiceTicketHistory, 
  getServiceTicketHistories, 
  removeServiceTicketHistory, 
  updateServiceTicketHistory 
} from "../controllers/serviceTicketHistoryController";


const router = Router()

router.get('/', getServiceTicketHistories)
router.get('/:serviceTicketId', getServiceTicketHistory)
router.post('/', createServiceTicketHistory)
router.put('/:serviceTicketId', updateServiceTicketHistory)
router.delete('/:serviceTicketId', removeServiceTicketHistory)

export default router