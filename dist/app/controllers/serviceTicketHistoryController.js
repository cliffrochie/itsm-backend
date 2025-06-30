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
exports.getServiceTicketHistories = getServiceTicketHistories;
exports.getServiceTicketHistory = getServiceTicketHistory;
exports.createServiceTicketHistory = createServiceTicketHistory;
exports.updateServiceTicketHistory = updateServiceTicketHistory;
exports.removeServiceTicketHistory = removeServiceTicketHistory;
const sorter_1 = __importDefault(require("../utils/sorter"));
const ServiceTicketHistory_1 = __importDefault(require("../models/ServiceTicketHistory"));
const mongoose_1 = require("mongoose");
function getServiceTicketHistories(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { serviceTicket, date, time, details, remarks, sort, noPage } = req.query;
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(sort);
            // if(serviceTicket) filter.serviceTicket = { $regex: serviceTicket + '.*', $options: 'i' }
            if (serviceTicket)
                filter.serviceTicket = new mongoose_1.Types.ObjectId(serviceTicket);
            if (date)
                filter.date = { $regex: date + '.*', $options: 'i' };
            if (time)
                filter.time = { $regex: time + '.*', $options: 'i' };
            if (details)
                filter.details = { $regex: details + '.*', $options: 'i' };
            if (remarks)
                filter.remarks = { $regex: remarks + '.*', $options: 'i' };
            console.log(filter);
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;
            let serviceTicketHistories = [];
            if (noPage) {
                serviceTicketHistories = yield ServiceTicketHistory_1.default.find(filter).sort(sortResult);
                res.json(serviceTicketHistories);
                return;
            }
            serviceTicketHistories = yield ServiceTicketHistory_1.default.find(filter).sort(sortResult).skip(skip).limit(limit);
            const total = yield ServiceTicketHistory_1.default.find(filter).countDocuments();
            const results = { results: serviceTicketHistories, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getServiceTicketHistories]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getServiceTicketHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const serviceTicketHistoryId = req.params.serviceTicketHistoryId;
            const serviceTicketHistory = yield ServiceTicketHistory_1.default.findById(serviceTicketHistoryId);
            if (!serviceTicketHistory) {
                res.status(404).json({ message: '`ServiceTicketHistory` not found' });
                return;
            }
            else {
                res.json(serviceTicketHistory);
            }
        }
        catch (error) {
            console.error(`Error [getServiceTicketHistory]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function createServiceTicketHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const serviceTicketHistory = new ServiceTicketHistory_1.default({
                serviceTicket: body.serviceTicket,
                date: body.date,
                time: body.time,
                details: body.details,
                remarks: body.remarks,
                createdBy: req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined,
            });
            yield serviceTicketHistory.save();
            res.status(201).json(serviceTicketHistory);
        }
        catch (error) {
            console.error(`Error [createServiceTicket]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateServiceTicketHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const serviceTicketHistoryId = req.params.serviceTicketHistoryId;
            const serviceTicketHistory = yield ServiceTicketHistory_1.default.findById(serviceTicketHistoryId);
            if (!serviceTicketHistory) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            serviceTicketHistory.serviceTicket = body.serviceTicket;
            serviceTicketHistory.date = body.date;
            serviceTicketHistory.time = body.time;
            serviceTicketHistory.details = body.details;
            serviceTicketHistory.remarks = body.remarks;
            serviceTicketHistory.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
            yield serviceTicketHistory.save();
            res.status(200).json(serviceTicketHistory);
        }
        catch (error) {
            console.error(`Error [updateserviceTicketHistory]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function removeServiceTicketHistory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const serviceTicketId = req.params.serviceTicketId;
            const deleted = yield ServiceTicketHistory_1.default.findByIdAndDelete(serviceTicketId);
            if (deleted) {
                res.status(204).json({});
            }
            else {
                res.status(500).json({ message: 'Error [removeServiceTicketHistory]: Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [removeServiceTicketHistory]: ${error}`);
            res.status(400).json(error);
        }
    });
}
