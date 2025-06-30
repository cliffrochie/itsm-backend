"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const clientController_1 = require("../controllers/clientController");
const router = (0, express_1.Router)();
router.get('/', auth_1.default, clientController_1.getClients);
router.get('/:clientId', auth_1.default, clientController_1.getClient);
router.post('/', auth_1.default, clientController_1.createClient);
router.put('/:clientId', auth_1.default, clientController_1.updateClient);
router.delete('/:clientId', auth_1.default, clientController_1.removeClient);
// router.get('/', getClients)
// router.get('/:clientId', getClient)
// router.post('/', createClient)
// router.put('/:clientId', updateClient)
// router.delete('/:clientId', removeClient)
exports.default = router;
