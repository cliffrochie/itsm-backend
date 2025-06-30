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
exports.getClients = getClients;
exports.getClient = getClient;
exports.createClient = createClient;
exports.updateClient = updateClient;
exports.removeClient = removeClient;
const sorter_1 = __importDefault(require("../utils/sorter"));
const Client_1 = __importDefault(require("../models/Client"));
const Designation_1 = __importDefault(require("../models/Designation"));
const Office_1 = __importDefault(require("../models/Office"));
const mongoose_1 = require("mongoose");
function getDesignation(filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield Designation_1.default.find({ _id: filter._id });
        return result[0];
    });
}
function getOffice(filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield Office_1.default.find({ _id: filter._id });
        return result[0];
    });
}
function getClients(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, includes, sort, noPage, fullName, office, designation, userId } = req.query;
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(sort);
            if (firstName)
                filter.firstName = { $regex: firstName + '.*', $options: 'i' };
            if (lastName)
                filter.lastName = { $regex: lastName + '.*', $options: 'i' };
            if (fullName)
                filter.$or = [{ firstName: { $regex: fullName, $options: 'i' } }, { lastName: { $regex: fullName, $options: 'i' } }];
            if (userId)
                filter.user = userId;
            const officeFilter = office
                ? { alias: { $regex: office, $options: 'i' } }
                : {};
            const designationFilter = designation
                ? { title: { $regex: designation, $options: 'i' } }
                : {};
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;
            let clients = [];
            let filteredClients = [];
            if (noPage) {
                if (includes === 'all') {
                    clients = yield Client_1.default
                        .find(filter)
                        .populate({ path: 'designation', match: designationFilter })
                        .populate({ path: 'office', match: officeFilter })
                        .sort(sortResult);
                }
                else {
                    clients = yield Client_1.default.find(filter).sort(sortResult);
                }
                filteredClients = clients.filter(client => {
                    const hasMatchingOffice = office ? client.office : true;
                    const hasMatchingDesignation = designation ? client.designation : true;
                    return hasMatchingOffice && hasMatchingDesignation;
                });
                res.json(filteredClients);
                return;
            }
            if (includes === 'all') {
                clients = yield Client_1.default
                    .find(filter)
                    .populate({ path: 'designation', match: designationFilter })
                    .populate({ path: 'office', match: officeFilter })
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            else if (includes === 'designation') {
                clients = yield Client_1.default
                    .find(filter)
                    .populate({ path: 'designation', match: designationFilter })
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            else if (includes === 'office') {
                clients = yield Client_1.default
                    .find(filter)
                    .populate({ path: 'office', match: officeFilter })
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            else {
                clients = yield Client_1.default
                    .find(filter)
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            if (filteredClients.length === 0) {
                filteredClients = clients;
            }
            filteredClients = clients.filter(client => {
                const hasMatchingOffice = office ? client.office : true;
                const hasMatchingDesignation = designation ? client.designation : true;
                return hasMatchingOffice && hasMatchingDesignation;
            });
            const total = yield Client_1.default
                .find(filter)
                .countDocuments();
            const results = { results: filteredClients, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getClients]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getClient(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { includes } = req.query;
            const clientId = req.params.clientId;
            let client = null;
            if (includes === 'all') {
                client = yield Client_1.default.findById(clientId).populate('designation').populate('office');
            }
            else {
                client = yield Client_1.default.findById(clientId);
            }
            if (!client) {
                res.status(404).json({ message: '`Client` not found' });
            }
            else {
                res.json(client);
            }
        }
        catch (error) {
            console.error(`Error [getClient]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function createClient(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const client = new Client_1.default({
                user: body.user ? new mongoose_1.Types.ObjectId(body.user) : undefined,
                firstName: body.firstName,
                middleName: body.middleName,
                lastName: body.lastName,
                extensionName: body.extensionName,
                contactNo: body.contactNo,
                email: body.email,
                designation: body.designation ? new mongoose_1.Types.ObjectId(body.designation) : undefined,
                office: body.office ? new mongoose_1.Types.ObjectId(body.office) : undefined,
                createdBy: req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined
            });
            yield client.save();
            res.status(201).json(client);
        }
        catch (error) {
            console.error(`Error [createClient]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateClient(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const clientId = req.params.clientId;
            const client = yield Client_1.default.findById(clientId);
            if (!client) {
                res.status(404).json({ message: '`Office` not found' });
                return;
            }
            client.user = body.user ? new mongoose_1.Types.ObjectId(body.user) : undefined;
            client.firstName = body.firstName;
            client.middleName = body.middleName;
            client.lastName = body.lastName;
            client.extensionName = body.extensionName;
            client.contactNo = body.contactNo;
            client.email = body.email;
            client.designation = body.designation ? new mongoose_1.Types.ObjectId(body.designation) : undefined;
            client.office = body.office ? new mongoose_1.Types.ObjectId(body.office) : undefined;
            client.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
            yield client.save();
            res.json(client);
        }
        catch (error) {
            console.error(`Error [updateClient]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function removeClient(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const clientId = req.params.clientId;
            const deleted = yield Client_1.default.findByIdAndDelete(clientId);
            if (deleted) {
                res.status(204).json({});
            }
            else {
                res.status(500).json({ message: 'Error [removeClient]: Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [removeClient]: ${error}`);
            res.status(400).json(error);
        }
    });
}
