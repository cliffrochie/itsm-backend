"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get('/', auth_1.default, userController_1.getUsers);
router.get('/current-user', auth_1.default, userController_1.getCurrentUser);
router.get('/client-details', auth_1.default, userController_1.getClientDetails);
router.get('/total-user-role', auth_1.default, userController_1.getTotalUserRoles);
router.get('/:id', auth_1.default, userController_1.getUser);
router.post('/signout', userController_1.userSignOut);
router.post('/signup', userController_1.userSignUp);
router.post('/signin', userController_1.userSignIn);
router.put('/:id', auth_1.default, userController_1.updateUser);
router.patch('/:id/change-password', auth_1.default, userController_1.changePassword);
// router.get('/', getUsers)
// router.get('/current-user', getCurrentUser)
// router.get('/:id', getUser)
// router.put('/:id', updateUser)
// router.post('/signup', userSignUp)
// router.post('/signin', userSignIn)
exports.default = router;
