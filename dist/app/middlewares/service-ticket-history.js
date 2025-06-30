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
exports.default = serviceTicketLoggerMiddleware;
const utils_1 = require("../utils");
const ServiceTicketHistory_1 = __importDefault(require("../models/ServiceTicketHistory"));
const mongoose_1 = require("mongoose");
const utils_2 = require("../utils");
function serviceTicketLoggerMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        res.on('finish', () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.logDetails && req.serviceTicketId) {
                    const action = (0, utils_1.actionInterpretation)(req.method);
                    const log = new ServiceTicketHistory_1.default({
                        serviceTicket: new mongoose_1.Types.ObjectId(req.serviceTicketId),
                        createdBy: new mongoose_1.Types.ObjectId(req.userId),
                        createdAt: new Date(),
                        date: (0, utils_2.changeDateFormatMMDDYYYY)(new Date()),
                        time: new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }),
                        action: action,
                        details: req.logDetails ? req.logDetails : 'No details provided.'
                    });
                    yield log.save();
                    console.log('saved');
                }
            }
            catch (error) {
                console.error(`Error [serviceTicketLoggerMiddleware]: ${error}`);
                res.status(403).json({ message: `Something went wrong: ${error}` });
                return;
            }
        }));
        next();
    });
}
