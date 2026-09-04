import { Router } from "express";
import { notificationController } from "../../controllers/notification.controller";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", (req, res, next) => {
  notificationController.index(req, res, next);
});

router.patch("/read-all", (req, res, next) => {
  notificationController.markAllAsRead(req, res, next);
});

router.patch("/:id/read", (req, res, next) => {
  notificationController.markAsRead(req, res, next);
});

export default router;
