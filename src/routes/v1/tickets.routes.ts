import { Router } from "express";
import { ticketController } from "../../controllers/ticket.controller";
import { validate } from "../../middlewares/validate";
import { authenticate } from "../../middlewares/authenticate";
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  assignEngineerSchema,
  ticketFeedbackSchema,
  ticketQuerySchema,
} from "../../validators/ticket.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate(ticketQuerySchema, "query"), (req, res, next) => {
  ticketController.index(req, res, next);
});

router.post("/", validate(createTicketSchema, "body"), (req, res, next) => {
  ticketController.store(req, res, next);
});

router.get("/:id", (req, res, next) => {
  ticketController.show(req, res, next);
});

router.put("/:id", validate(updateTicketSchema, "body"), (req, res, next) => {
  ticketController.update(req, res, next);
});

router.patch("/:id/status", validate(updateTicketStatusSchema, "body"), (req, res, next) => {
  ticketController.updateStatus(req, res, next);
});

router.patch("/:id/assign", validate(assignEngineerSchema, "body"), (req, res, next) => {
  ticketController.assign(req, res, next);
});

router.post("/:id/feedback", validate(ticketFeedbackSchema, "body"), (req, res, next) => {
  ticketController.feedback(req, res, next);
});

export default router;
