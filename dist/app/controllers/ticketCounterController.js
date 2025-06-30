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
exports.getTicketCounters = getTicketCounters;
exports.getTicketCounter = getTicketCounter;
exports.createTicketCounter = createTicketCounter;
exports.updateTicketCounter = updateTicketCounter;
exports.removeTicketCounter = removeTicketCounter;
const sorter_1 = __importDefault(require("../utils/sorter"));
const mongoose_1 = require("mongoose");
const TicketCounter_1 = __importDefault(require("../models/TicketCounter"));
function getTicketCounters(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { year, counter, noPage } = req.query;
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(req.query.sort);
            if (year)
                filter.year = { $regex: year + '.*', $options: 'i' };
            if (counter)
                filter.counter = { $regex: counter + '.*', $options: 'i' };
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;
            let ticketCounters = [];
            if (noPage) {
                ticketCounters = yield TicketCounter_1.default.find(filter).sort(sortResult);
                res.json(ticketCounters);
                return;
            }
            ticketCounters = yield TicketCounter_1.default.find(filter).sort(sortResult).skip(skip).limit(limit);
            const total = yield TicketCounter_1.default.find(filter).countDocuments();
            const results = { results: ticketCounters, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getTicketCounters]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getTicketCounter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketCounterId = req.params.ticketCounterId;
            const ticketCounter = yield TicketCounter_1.default.findById(ticketCounterId);
            if (!ticketCounter) {
                res.status(404).json({ message: '`Ticket Counter` not found' });
                return;
            }
            res.json(ticketCounter);
        }
        catch (error) {
            console.error(`Error [getTicketCounter]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function createTicketCounter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const ticketCounter = new TicketCounter_1.default({
                year: body.year,
                counter: body.counter,
                createdBy: req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined
            });
            yield ticketCounter.save();
            res.status(201).json(ticketCounter);
        }
        catch (error) {
            console.error(`Error [createTicketCounter]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateTicketCounter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const ticketCounterId = req.params.ticketCounterId;
            const ticketCounter = yield TicketCounter_1.default.findById(ticketCounterId);
            if (!ticketCounter) {
                res.status(404).json({ message: '`Ticket Counter` not found' });
                return;
            }
            ticketCounter.year = body.year;
            ticketCounter.counter = body.counter;
            yield ticketCounter.save();
            res.json(ticketCounter);
        }
        catch (error) {
            console.error(`Error [updateTicketCounter]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function removeTicketCounter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const ticketCounterId = req.params.ticketCounterId;
            const deleted = yield TicketCounter_1.default.findByIdAndDelete(ticketCounterId);
            if (deleted) {
                res.status(204).json({});
            }
            else {
                res.status(500).json({ message: 'Error [removeTicketCounter]: Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [removeTicketCounter]: ${error}`);
            res.status(400).json(error);
        }
    });
}
