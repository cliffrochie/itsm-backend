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
exports.userSignIn = userSignIn;
exports.userSignUp = userSignUp;
exports.userSignOut = userSignOut;
exports.getCurrentUser = getCurrentUser;
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.getClientDetails = getClientDetails;
exports.updateUser = updateUser;
exports.changePassword = changePassword;
exports.getTotalUserRoles = getTotalUserRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const sorter_1 = __importDefault(require("../utils/sorter"));
const Client_1 = __importDefault(require("../models/Client"));
const mongoose_1 = require("mongoose");
function userSignIn(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, password } = req.body;
            const user = yield User_1.default.findOne({ username });
            console.log(`User: ${user}`);
            if (!user) {
                res.status(404).json({ message: 'Invalid credentials!' });
                return;
            }
            if (!user.comparePassword(password)) {
                res.status(404).json({ message: 'Invalid credentials!!' });
                return;
            }
            const token = jsonwebtoken_1.default.sign({
                userId: user._id,
                username: user.username,
                role: user.role,
                isActive: user.isActive
            }, process.env.SECRET_KEY || 'notsosecret', { expiresIn: '24h' });
            res.cookie('token', token, {
                httpOnly: true, // Prevent JavaScript access
                secure: false, // Use HTTPS in production
                sameSite: 'strict', // Protect against CSRF
                maxAge: 24 * 60 * 60 * 1000 // 1 day expiration
            });
            res.json({ message: 'Login successful', token: token });
        }
        catch (error) {
            console.error(`Error [userSignIn]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function userSignUp(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const user = new User_1.default(body);
            const userResult = yield user.save();
            const clientCheck = yield Client_1.default.findOne({
                firstName: userResult.firstName,
                middleName: userResult.middleName,
                lastName: userResult.lastName,
                extensionName: userResult.extensionName
            });
            if (clientCheck && userResult) {
                clientCheck.user = new mongoose_1.Types.ObjectId(user._id);
                clientCheck.save();
            }
            else if (userResult) {
                const client = new Client_1.default({
                    firstName: userResult.firstName,
                    middleName: userResult.middleName,
                    lastName: userResult.lastName,
                    contactNo: userResult.contactNo,
                    email: userResult.email,
                    user: new mongoose_1.Types.ObjectId(user._id)
                });
                client.save();
            }
            const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.SECRET_KEY || 'notsosecret', { expiresIn: '1h' });
            res.status(201).json({ token });
        }
        catch (error) {
            console.error(`Error [userSignUp]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function userSignOut(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            res.clearCookie('token', {
                httpOnly: true,
                secure: false,
                sameSite: 'strict'
            });
            res.status(200).json({ message: 'Signed-out successfully.' });
        }
        catch (error) {
            console.error(`Error [userSignOut]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getCurrentUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            const user = yield User_1.default.findById(userId).select('-password');
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json(user);
        }
        catch (error) {
            console.error(`Error [getCurrentUser]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, middleName, lastName, extensionName, fullName, username, email, role, personnel, exclude, noPage } = req.query;
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(req.query.sort);
            if (firstName)
                filter.firstName = { $regex: firstName + '.*', $options: 'i' };
            if (middleName)
                filter.middleName = { $regex: middleName + '.*', $options: 'i' };
            if (lastName)
                filter.lastName = { $regex: lastName + '.*', $options: 'i' };
            if (username)
                filter.username = { $regex: username + '.*', $options: 'i' };
            if (email)
                filter.email = { $regex: email + '.*', $options: 'i' };
            if (extensionName)
                filter.extensionName = { $regex: extensionName + '.*', $options: 'i' };
            if (role)
                filter.role = { $regex: role + '.*', $options: 'i' };
            if (personnel)
                filter.role = { $in: ['staff'] };
            if (fullName)
                filter.$or = [{ firstName: { $regex: fullName, $options: 'i' } }, { lastName: { $regex: fullName, $options: 'i' } }];
            if (exclude)
                filter._id = { $ne: exclude };
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;
            let users = [];
            console.log(filter);
            if (role && personnel) {
                console.log('1');
                res.status(400).json({ message: 'Query parameters are conflict, role and personnel should not be used at the same time.' });
                return;
            }
            if (noPage) {
                console.log('4');
                users = yield User_1.default.find(filter).select('-password').sort(sortResult);
                res.json(users);
                return;
            }
            users = yield User_1.default.find(filter).select('-password').sort(sortResult).skip(skip).limit(limit);
            const total = yield User_1.default.find(filter).countDocuments();
            // const total = users.length
            const results = { results: users, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getUsers]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield User_1.default.findById(req.params.id).select('-password');
            if (!user) {
                res.status(404).json({ messsage: 'User not found' });
                return;
            }
            res.json(user);
        }
        catch (error) {
            console.error(`Error [getUserById]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getClientDetails(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const clientDetails = yield Client_1.default.find({ user: new mongoose_1.Types.ObjectId(req.userId) });
            if (!clientDetails) {
                res.status(404).json({ message: '`Client Details` not found.' });
                return;
            }
            res.json(clientDetails[0]);
        }
        catch (error) {
            console.error(`Error [getClientDetails]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield User_1.default.findById(req.params.id).select('-password');
            if (!user) {
                res.status(404).json({ messsage: 'User not found' });
                return;
            }
            user.avatar = req.body.avatar;
            user.username = req.body.username;
            user.email = req.body.email;
            user.firstName = req.body.firstName;
            user.middleName = req.body.middleName;
            user.lastName = req.body.lastName;
            user.extensionName = req.body.extensionName;
            user.contactNo = req.body.contactNo;
            user.email = req.body.email;
            user.role = req.body.role;
            user.isActive = req.body.isActive;
            user.save();
            res.json(user);
        }
        catch (error) {
            console.error(`Error [updateUser]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function changePassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield User_1.default.findById(req.params.id).select('-username');
            if (!user) {
                res.status(404).json({ messsage: 'User not found' });
                return;
            }
            user.password = req.body.password;
            const done = user.save();
            if (!done) {
                res.status(400).json({ message: 'Something went wrong.' });
                return;
            }
            res.status(200).json({ message: 'Successfully changed the password.' });
        }
        catch (error) {
            console.error(`Error [changePassword]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getTotalUserRoles(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { total, totalSuperAdmin, totalAdmin, totalStaff, totalUser, } = req.query;
            let result = {};
            if (total) {
                const total = yield User_1.default
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { total: total });
            }
            if (totalSuperAdmin) {
                const total = yield User_1.default
                    .find({ role: 'superadmin' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalSuperAdmin: total });
            }
            if (totalAdmin) {
                const total = yield User_1.default
                    .find({ role: 'admin' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalAdmin: total });
            }
            if (totalStaff) {
                const total = yield User_1.default
                    .find({ role: 'staff' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalStaff: total });
            }
            if (totalUser) {
                const total = yield User_1.default
                    .find({ role: 'user' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalUser: total });
            }
            res.json(result);
        }
        catch (error) {
            console.error(`Error [getTotalUserRoles]: ${error}`);
            res.status(400).json(error);
        }
    });
}
