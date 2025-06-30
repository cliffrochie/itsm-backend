import { Router } from "express";
import auth from "../middlewares/auth";
import {
  createServiceTicketHistory,
  getServiceTicketHistory,
  getServiceTicketHistories,
  removeServiceTicketHistory,
  updateServiceTicketHistory,
} from "../controllers/serviceTicketHistoryController";

const router = Router();

router.get("/", auth, getServiceTicketHistories);
router.get("/:serviceTicketId", auth, getServiceTicketHistory);
router.post("/", auth, createServiceTicketHistory);
router.put("/:serviceTicketId", auth, updateServiceTicketHistory);
router.delete("/:serviceTicketId", auth, removeServiceTicketHistory);

export default router;
