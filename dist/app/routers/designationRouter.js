"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const designationController_1 = require("../controllers/designationController");
const router = (0, express_1.Router)();
router.get('/', auth_1.default, designationController_1.getDesignations);
router.get('/:designationId', auth_1.default, designationController_1.getDesignation);
router.post('/', auth_1.default, designationController_1.createDesignation);
router.put('/:designationId', auth_1.default, designationController_1.updateDesignation);
router.delete('/:designationId', auth_1.default, designationController_1.removeDesignation);
// router.get('/', getDesignations)
// router.get('/:designationId', getDesignation)
// router.post('/', createDesignation)
// router.put('/:designationId', updateDesignation)
// router.delete('/:designationId', removeDesignation)
exports.default = router;
