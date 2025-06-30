"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const ticketCounterController_1 = require("../controllers/ticketCounterController");
const router = (0, express_1.Router)();
router.get('/', auth_1.default, ticketCounterController_1.getTicketCounters);
router.get('/:ticketCounterId', auth_1.default, ticketCounterController_1.getTicketCounter);
router.post('/', auth_1.default, ticketCounterController_1.createTicketCounter);
router.put('/:ticketCounterId', auth_1.default, ticketCounterController_1.updateTicketCounter);
router.delete('/:ticketCounterId', auth_1.default, ticketCounterController_1.removeTicketCounter);
exports.default = router;
