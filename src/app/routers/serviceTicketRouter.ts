import { Router } from "express";
import authMiddleware from "../middlewares/auth";
import serviceTicketLoggerMiddleware from "../middlewares/service-ticket-history";
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
  inputFindings,
  inputServiceRendered,
  getRequestedServiceTickets,
  getAssignedServiceTickets,
  getAssignedClosedServiceTickets,
  getTotalServiceStatuses,
  getTotalTaskTypes,
  getTotalEquipmentTypes,
  getSearchedTicketNo,
  setServiceRating,
  closeTicket,
} from "../controllers/serviceTicketController";

const router = Router();

router.get("/", authMiddleware, getServiceTickets);
router.get("/generate", authMiddleware, getGeneratedTicketNo);
router.get("/requested", authMiddleware, getRequestedServiceTickets);
router.get("/assigned", authMiddleware, getAssignedServiceTickets);
router.get("/assigned-closed", authMiddleware, getAssignedClosedServiceTickets);
router.get("/search-ticket-no", authMiddleware, getSearchedTicketNo);
router.get("/total-service-status", authMiddleware, getTotalServiceStatuses);
router.get("/total-task-type", authMiddleware, getTotalTaskTypes);
router.get("/total-equipment-type", authMiddleware, getTotalEquipmentTypes);
router.get("/:serviceTicketId", authMiddleware, getServiceTicket);
router.post(
  "/",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  createServiceTicket
);
router.put(
  "/:serviceTicketId",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  updateServiceTicket
);
router.patch(
  "/:serviceTicketId/input-findings",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  inputFindings
);
router.patch(
  "/:serviceTicketId/service-rendered",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  inputServiceRendered
);
router.patch(
  "/:serviceTicketId/update-service-status",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  updateServiceStatus
);
router.patch(
  "/:serviceTicketId/assign-service-engineer",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  assignServiceEngineer
);
router.patch(
  "/:serviceTicketId/escalate-service",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  escalateService
);
router.patch(
  "/:serviceTicketId/set-rating",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  setServiceRating
);
router.patch(
  "/:serviceTicketId/close-ticket",
  authMiddleware,
  serviceTicketLoggerMiddleware,
  closeTicket
);
router.delete("/:serviceTicketId", authMiddleware, removeServiceTicket);

export default router;
