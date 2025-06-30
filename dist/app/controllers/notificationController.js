"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.getNotification = getNotification;
exports.notificationIsBeingRead = notificationIsBeingRead;
exports.clearAllAuthenticatedUserNotifications = clearAllAuthenticatedUserNotifications;
const sorter_1 = __importDefault(require("../utils/sorter"));
const mongoose_1 = require("mongoose");
const Notification_1 = __importDefault(require("../models/Notification"));
function getNotifications(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { userId, serviceTicketId, isRead, noPage } = req.query;
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(req.query.sort);
            const serviceTicket = new mongoose_1.Types.ObjectId(serviceTicketId);
            if (userId)
                filter.user = new mongoose_1.Types.ObjectId(userId);
            if (serviceTicketId)
                filter.serviceTicket = new mongoose_1.Types.ObjectId(serviceTicketId);
            if (isRead)
                filter.isRead = isRead;
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 5;
            const skip = (page - 1) * limit;
            let notifications = [];
            if (noPage) {
                notifications = yield Notification_1.default.find(filter).sort(sortResult);
                res.json(notifications);
                return;
            }
            notifications = yield Notification_1.default.find(filter).sort(sortResult).skip(skip).limit(limit);
            const total = yield Notification_1.default.find(filter).countDocuments();
            const results = { results: notifications, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getNotifications]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getNotification(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const notificationId = req.params.notificationId;
            const notification = yield Notification_1.default.findById(notificationId);
            if (!notification) {
                res.status(404).json({ message: '`Notification` not found' });
                return;
            }
            res.json(notification);
        }
        catch (error) {
            console.error(`Error [getNotification]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function notificationIsBeingRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const notificationId = req.params.notificationId;
            const notification = yield Notification_1.default.findById(notificationId);
            if (!notification) {
                res.status(404).json({ message: '`Notification` not found' });
                return;
            }
            notification.isRead = true;
            const done = yield notification.save();
            if (!done) {
                res.status(400).json({ message: 'Something went wrong when updating the notification' });
            }
            res.json({});
        }
        catch (error) {
            console.error(`Error [notificationIsBeingRead]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function clearAllAuthenticatedUserNotifications(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.params.userId;
            yield Notification_1.default.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
            res.json({});
        }
        catch (error) {
            console.error(`Error [clearAllAuthenticatedUserNotifications]: ${error}`);
            res.status(400).json(error);
        }
    });
}
