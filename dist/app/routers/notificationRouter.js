"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.get('/', auth_1.default, notificationController_1.getNotifications);
router.get('/:notificationId', auth_1.default, notificationController_1.getNotification);
router.put('/:notificationId/read', auth_1.default, notificationController_1.notificationIsBeingRead);
router.put('/clear-user-notifications/:userId/', auth_1.default, notificationController_1.clearAllAuthenticatedUserNotifications);
exports.default = router;
