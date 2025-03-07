import { Router } from "express";
import auth from "../middlewares/auth";
import { getNotifications, getNotification, notificationIsBeingRead } from "../controllers/notificationController";

const router = Router()

router.get('/', auth, getNotifications)
router.get('/:notificationId', auth, getNotification)
router.put('/:notificationId/read', auth, notificationIsBeingRead)


export default router