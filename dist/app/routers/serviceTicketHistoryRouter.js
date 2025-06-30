"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const serviceTicketHistoryController_1 = require("../controllers/serviceTicketHistoryController");
const router = (0, express_1.Router)();
router.get('/', auth_1.default, serviceTicketHistoryController_1.getServiceTicketHistories);
router.get('/:serviceTicketId', auth_1.default, serviceTicketHistoryController_1.getServiceTicketHistory);
router.post('/', auth_1.default, serviceTicketHistoryController_1.createServiceTicketHistory);
router.put('/:serviceTicketId', auth_1.default, serviceTicketHistoryController_1.updateServiceTicketHistory);
router.delete('/:serviceTicketId', auth_1.default, serviceTicketHistoryController_1.removeServiceTicketHistory);
exports.default = router;
