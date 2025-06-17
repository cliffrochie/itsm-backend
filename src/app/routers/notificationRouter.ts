import { Router } from "express";
import auth from "../middlewares/auth";
import { getNotifications, getNotification, notificationIsBeingRead, clearAllAuthenticatedUserNotifications } from "../controllers/notificationController";

const router = Router()

router.get('/', auth, getNotifications)
router.get('/:notificationId', auth, getNotification)
router.put('/:notificationId/read', auth, notificationIsBeingRead)
router.put('/clear-user-notifications/:userId/', auth, clearAllAuthenticatedUserNotifications)

export default router