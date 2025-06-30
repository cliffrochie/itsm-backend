"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const officeController_1 = require("../controllers/officeController");
const router = (0, express_1.Router)();
router.get('/', auth_1.default, officeController_1.getOffices);
router.get('/:officeId', auth_1.default, officeController_1.getOffice);
router.post('/', auth_1.default, officeController_1.createOffice);
router.put('/:officeId', auth_1.default, officeController_1.updateOffice);
router.delete('/:officeId', auth_1.default, officeController_1.removeOffice);
// router.get('/', getOffices)
// router.get('/:officeId', getOffice)
// router.post('/', createOffice)
// router.put('/:officeId', updateOffice)
// router.delete('/:officeId', removeOffice)
exports.default = router;
