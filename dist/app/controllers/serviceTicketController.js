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
exports.getServiceTickets = getServiceTickets;
exports.getServiceTicket = getServiceTicket;
exports.getGeneratedTicketNo = getGeneratedTicketNo;
exports.createServiceTicket = createServiceTicket;
exports.updateServiceTicket = updateServiceTicket;
exports.removeServiceTicket = removeServiceTicket;
exports.updateServiceStatus = updateServiceStatus;
exports.assignServiceEngineer = assignServiceEngineer;
exports.escalateService = escalateService;
exports.inputFindings = inputFindings;
exports.inputServiceRendered = inputServiceRendered;
exports.getRequestedServiceTickets = getRequestedServiceTickets;
exports.getAssignedServiceTickets = getAssignedServiceTickets;
exports.getAssignedClosedServiceTickets = getAssignedClosedServiceTickets;
exports.getTotalServiceStatuses = getTotalServiceStatuses;
exports.getTotalTaskTypes = getTotalTaskTypes;
exports.getTotalEquipmentTypes = getTotalEquipmentTypes;
exports.getSearchedTicketNo = getSearchedTicketNo;
exports.setServiceRating = setServiceRating;
exports.closeTicket = closeTicket;
const sorter_1 = __importDefault(require("../utils/sorter"));
const mongoose_1 = require("mongoose");
const utils_1 = require("../utils");
const User_1 = __importDefault(require("../models/User"));
const ServiceTicket_1 = __importDefault(require("../models/ServiceTicket"));
const notification_1 = require("../utils/notification");
function getServiceTickets(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { ticketNo, taskType, title, natureOfWork, serialNo, equipmentType, defectsFound, serviceRendered, serviceStatus, priority, remarks, adminRemarks, rating, ratingComment, sort, includes, noPage, client, clientId, serviceEngineer, serviceEngineerId, createdBy } = req.query;
            console.log(clientId);
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(sort);
            if (ticketNo)
                filter.ticketNo = { $regex: ticketNo + '.*', $options: 'i' };
            if (taskType)
                filter.taskType = { $regex: taskType + '.*', $options: 'i' };
            if (title)
                filter.title = { $regex: title + '.*', $options: 'i' };
            if (natureOfWork)
                filter.natureOfWork = { $regex: natureOfWork + '.*', $options: 'i' };
            if (serialNo)
                filter.serialNo = { $regex: serialNo + '.*', $options: 'i' };
            if (equipmentType)
                filter.equipmentType = { $regex: equipmentType + '.*', $options: 'i' };
            if (defectsFound)
                filter.defectsFound = { $regex: defectsFound + '.*', $options: 'i' };
            if (serviceRendered)
                filter.serviceRendered = { $regex: serviceRendered + '.*', $options: 'i' };
            if (serviceStatus)
                filter.serviceStatus = { $regex: serviceStatus + '.*', $options: 'i' };
            if (priority)
                filter.priority = { $regex: priority + '.*', $options: 'i' };
            if (remarks)
                filter.remarks = { $regex: remarks + '.*', $options: 'i' };
            if (adminRemarks)
                filter.adminRemarks = { $regex: adminRemarks + '.*', $options: 'i' };
            if (rating)
                filter.rating = { $regex: rating + '.*', $options: 'i' };
            if (ratingComment)
                filter.ratingComment = { $regex: ratingComment + '.*', $options: 'i' };
            if (clientId)
                filter.client = clientId;
            if (serviceEngineerId)
                filter.serviceEngineer = serviceEngineerId;
            if (createdBy)
                filter.createdBy = createdBy;
            const clientFilter = client
                ? { $or: [{ firstName: { $regex: client, $options: 'i' } }, { lastName: { $regex: client, $options: 'i' } }] }
                : {};
            const serviceEngineerFilter = serviceEngineer
                ? { $or: [{ firstName: { $regex: serviceEngineer, $options: 'i' } }, { lastName: { $regex: serviceEngineer, $options: 'i' } }] }
                : {};
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;
            let serviceTickets = [];
            let filteredServiceTickets = [];
            if (noPage) {
                serviceTickets = yield ServiceTicket_1.default.find(filter).sort(sortResult);
                res.json(serviceTickets);
                return;
            }
            if (includes === 'all') {
                serviceTickets = yield ServiceTicket_1.default
                    .find(filter)
                    .populate({
                    path: 'serviceEngineer',
                    match: serviceEngineerFilter
                })
                    .populate({
                    path: 'client',
                    match: clientFilter
                })
                    .populate('createdBy')
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            else if (includes === 'serviceEngineer') {
                serviceTickets = yield ServiceTicket_1.default
                    .find(filter)
                    .populate({
                    path: 'serviceEngineer',
                    match: serviceEngineerFilter
                })
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            else if (includes === 'client') {
                serviceTickets = yield ServiceTicket_1.default
                    .find(filter)
                    .populate({
                    path: 'client',
                    match: clientFilter
                })
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            else {
                serviceTickets = yield ServiceTicket_1.default
                    .find(filter)
                    .sort(sortResult)
                    .skip(skip)
                    .limit(limit);
            }
            filteredServiceTickets = serviceTickets.filter(serviceTicket => {
                const hasMatchingOffice = client ? serviceTicket.client : true;
                const hasMatchingDesignation = serviceEngineer ? serviceTicket.serviceEngineer : true;
                return hasMatchingOffice && hasMatchingDesignation;
            });
            // console.log(filteredServiceTickets)
            // console.log('----')
            // console.log(serviceTickets)
            const total = yield ServiceTicket_1.default
                .find(filter)
                .countDocuments();
            const results = { results: filteredServiceTickets, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getServiceTickets]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getServiceTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const serviceTicketId = req.params.serviceTicketId;
            const serviceTicket = yield ServiceTicket_1.default.findById(serviceTicketId)
                .populate({
                path: 'client',
                populate: [{ path: 'designation' }, { path: 'office' }],
            }).populate('serviceEngineer').populate('createdBy');
            if (!serviceTicket) {
                res.status(404).json({ message: '`ServiceTicket` not found' });
                return;
            }
            else {
                res.json(serviceTicket);
            }
        }
        catch (error) {
            console.error(`Error [getServiceTicket]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getGeneratedTicketNo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // console.log('----')
            const ticket = yield (0, utils_1.generateTicket)('Printer', 'Consultation');
            // console.log(ticket)
            res.json({ ticket: ticket });
        }
        catch (error) {
            console.error(`Error [getGeneratedTicketNo]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function createServiceTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const ticket = yield (0, utils_1.generateTicket)(body.equipmentType, body.taskType);
            const adminUsers = yield User_1.default.find({ role: 'admin' });
            const serviceTicket = new ServiceTicket_1.default({
                ticketNo: ticket,
                taskType: body.taskType,
                title: body.title,
                natureOfWork: body.natureOfWork,
                serialNo: body.serialNo,
                equipmentType: body.equipmentType,
                defectsFound: body.defectsFound,
                serviceRendered: body.serviceRendered,
                serviceStatus: body.serviceStatus,
                priority: body.priority,
                remarks: body.remarks,
                adminRemarks: body.adminRemarks,
                serviceEngineer: body.serviceEngineer ? new mongoose_1.Types.ObjectId(body.serviceEngineer) : undefined,
                client: body.client ? new mongoose_1.Types.ObjectId(body.client) : undefined,
                createdBy: req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined,
            });
            const authenticatedUser = yield User_1.default.findById(req.userId);
            if (!authenticatedUser) {
                res.status(404).json({ message: '`User` not found' });
                return;
            }
            const result = yield serviceTicket.save();
            if (!result) {
                res.status(400).json({ message: 'Error [createServiceTicket]: Something went wrong' });
                return;
            }
            adminUsers.forEach((admin) => {
                const message = `A new service request with a ticket number ${serviceTicket.ticketNo} is being created.`;
                const serviceTicketId = serviceTicket ? serviceTicket._id : '';
                (0, notification_1.createNotification)(admin._id, serviceTicketId.toString(), serviceTicket.ticketNo, message);
            });
            req.serviceTicketId = String(serviceTicket._id);
            req.logDetails = `${serviceTicket.ticketNo} is created by ${(0, utils_1.capitalizeFirstLetter)(authenticatedUser.firstName)} ${(0, utils_1.capitalizeFirstLetter)(authenticatedUser.lastName)}.`;
            res.status(201).json(serviceTicket);
        }
        catch (error) {
            console.error(`Error [createServiceTicket]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateServiceTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            // console.log(body)
            const serviceTicketId = req.params.serviceTicketId;
            const serviceTicket = yield ServiceTicket_1.default.findById(serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            req.serviceTicketId = serviceTicketId;
            const user = yield User_1.default.findById(req.userId);
            if (!user) {
                res.status(404).json({ message: '`User` not found' });
                return;
            }
            const userFullName = (0, utils_1.capitalizeFirstLetter)(user.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(user.lastName);
            // Update Service Status
            if (serviceTicket.serviceStatus !== body.serviceStatus) {
                req.logDetails = `Service status is updated from "${serviceTicket.serviceStatus}" to "${body.serviceStatus}." by ${userFullName}`;
            }
            // Update priority level
            if (serviceTicket.priority !== body.priority) {
                req.logDetails = `Priority level is updated from "${serviceTicket.priority ? serviceTicket.priority : 'none'}" to "${body.priority}" by ${userFullName}.`;
            }
            let statusAssigned = '';
            // Assign Service Engineer
            if (serviceTicket.serviceEngineer === null && String(serviceTicket.serviceEngineer) !== String(req.body.serviceEngineer)) {
                const newServiceEngineer = yield User_1.default.findById(req.body.serviceEngineer);
                if (!newServiceEngineer) {
                    res.status(404).json({ message: '`Service Engineer` not found' });
                    return;
                }
                const newFullName = (0, utils_1.capitalizeFirstLetter)(newServiceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(newServiceEngineer.lastName);
                statusAssigned = 'assigned';
                req.logDetails = `Service is assigned to ${newFullName} with ${body.priority ? body.priority : 'no'} priority level by ${userFullName}.`;
            }
            // Escalate Problem
            if (serviceTicket.serviceEngineer !== null && String(serviceTicket.serviceEngineer) !== String(body.serviceEngineer)) {
                const newServiceEngineer = yield User_1.default.findById(req.body.serviceEngineer);
                if (!newServiceEngineer) {
                    res.status(404).json({ message: '`Service Engineer` not found' });
                    return;
                }
                const oldServiceEngineer = yield User_1.default.findById(serviceTicket.serviceEngineer);
                if (!oldServiceEngineer) {
                    res.status(404).json({ message: '`Service Engineer` not found' });
                    return;
                }
                const oldFullName = (0, utils_1.capitalizeFirstLetter)(oldServiceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(oldServiceEngineer.lastName);
                const newFullName = (0, utils_1.capitalizeFirstLetter)(newServiceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(newServiceEngineer.lastName);
                req.logDetails = `Service is escalted from ${oldFullName} to ${newFullName} with ${body.priority ? body.priority : 'no'} priority level by ${userFullName}.`;
            }
            // Defects Found
            if (body.defectsFound && serviceTicket.defectsFound !== body.defectsFound) {
                req.logDetails = `The problem or cause is "${body.defectsFound}."`;
            }
            // Service Rendered
            if (body.serviceRendered && serviceTicket.serviceRendered !== body.serviceRendered) {
                req.logDetails = `The service rendered is "${body.serviceRendered}."`;
            }
            if ((body.defectsFound && body.serviceRendered) &&
                (serviceTicket.defectsFound !== body.defectsFound) &&
                (serviceTicket.serviceRendered !== body.serviceRendered)) {
                req.logDetails = `The problem or cause is "${body.defectsFound}" and the rendered service is "${body.serviceRendered}" by ${userFullName}.`;
            }
            serviceTicket.ticketNo = body.ticketNo;
            serviceTicket.taskType = body.taskType;
            serviceTicket.title = body.title;
            serviceTicket.natureOfWork = body.natureOfWork;
            serviceTicket.serialNo = body.serialNo;
            serviceTicket.equipmentType = body.equipmentType;
            serviceTicket.defectsFound = body.defectsFound;
            serviceTicket.serviceRendered = body.serviceRendered;
            serviceTicket.serviceStatus = statusAssigned === 'assigned' ? statusAssigned : body.serviceStatus;
            serviceTicket.priority = body.priority;
            serviceTicket.remarks = body.remarks;
            serviceTicket.adminRemarks = body.adminRemarks;
            serviceTicket.serviceEngineer = body.serviceEngineer ? new mongoose_1.Types.ObjectId(body.serviceEngineer) : undefined;
            serviceTicket.client = body.client ? new mongoose_1.Types.ObjectId(body.client) : undefined;
            serviceTicket.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
            yield serviceTicket.save();
            res.status(200).json(serviceTicket);
        }
        catch (error) {
            console.error(`Error [updateServiceTicket]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function removeServiceTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const serviceTicketId = req.params.serviceTicketId;
            const deleted = yield ServiceTicket_1.default.findByIdAndDelete(serviceTicketId);
            if (deleted) {
                res.status(204).json({});
            }
            else {
                res.status(500).json({ message: 'Error [removeServiceTicket]: Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [removeServiceTicket]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateServiceStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const serviceTicketId = req.params.serviceTicketId;
            const serviceTicket = yield ServiceTicket_1.default.findById(serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            const user = yield User_1.default.findById(req.userId);
            if (!user) {
                res.status(404).json({ message: '`User` not found' });
                return;
            }
            const userFullName = (0, utils_1.capitalizeFirstLetter)(user.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(user.lastName);
            if (serviceTicket.serviceStatus !== body.serviceStatus) {
                req.serviceTicketId = serviceTicketId;
                req.logDetails = `Service status is updated from "${serviceTicket.serviceStatus}" to "${body.serviceStatus}" by ${userFullName}.`;
                serviceTicket.serviceStatus = body.serviceStatus;
                serviceTicket.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
                const done = yield serviceTicket.save();
                if (!done) {
                    res.status(400).json({ message: 'Error [updateServiceStatus]: Something went wrong.' });
                    return;
                }
                let requestor = '';
                if (serviceTicket.createdBy)
                    requestor = serviceTicket.createdBy.toString();
                let message = `Service status for ${serviceTicket.ticketNo} is updated to "${serviceTicket.serviceStatus}".`;
                switch (serviceTicket.serviceStatus) {
                    case 'open':
                        message = `${serviceTicket.ticketNo} is now open.`;
                        break;
                    case 'in progress':
                        message = `Service engineer is now working for ${serviceTicket.ticketNo}.`;
                        break;
                    case 'on hold':
                        message = `${serviceTicket.ticketNo} has been put on hold.`;
                        break;
                    case 'escalated':
                        message = `${serviceTicket.ticketNo} has been escalated to another service engineer.`;
                        break;
                    case 'canceled':
                        message = `${serviceTicket.ticketNo} has been canceled by the administrator.`;
                        break;
                    case 'reopened':
                        message = `${serviceTicket.ticketNo} has been re-opened by the administrator.`;
                        break;
                    case 'resolved':
                        message = `The service engineer has completed its task for ${serviceTicket.ticketNo}, please provide a feedback to his/her performance.`;
                        break;
                    case 'resolved':
                        message = `Ticket ${serviceTicket.ticketNo} is now closed by ${userFullName}.`;
                        break;
                }
                yield (0, notification_1.createNotification)(requestor, serviceTicketId, serviceTicket.ticketNo, message);
                res.status(200).json(serviceTicket);
                return;
            }
            res.status(500).json({ message: 'Error [updateServiceStatus]: Something went wrong.' });
            return;
        }
        catch (error) {
            console.error(`Error [updateServiceStatus]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function assignServiceEngineer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const serviceTicketId = req.params.serviceTicketId;
            const serviceTicket = yield ServiceTicket_1.default.findById(serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            if ((serviceTicket.serviceEngineer !== null || serviceTicket.serviceEngineer !== undefined) && body.serviceEngineer && body.priority) {
                const serviceEngineer = yield User_1.default.findById(body.serviceEngineer);
                if (!serviceEngineer) {
                    res.status(404).json({ message: '`Service Engineer` not found' });
                    return;
                }
                const user = yield User_1.default.findById(req.userId);
                if (!user) {
                    res.status(404).json({ message: '`User` not found' });
                    return;
                }
                const serviceEngineerFullName = (0, utils_1.capitalizeFirstLetter)(serviceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(serviceEngineer.lastName);
                const userFullName = (0, utils_1.capitalizeFirstLetter)(user.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(user.lastName);
                req.serviceTicketId = serviceTicketId;
                req.logDetails = `Service is assigned to ${serviceEngineerFullName} with ${body.priority ? body.priority : 'no'} priority level by ${userFullName}.`;
                serviceTicket.serviceEngineer = new mongoose_1.Types.ObjectId(body.serviceEngineer);
                serviceTicket.serviceStatus = 'assigned';
                serviceTicket.priority = body.priority;
                serviceTicket.adminRemarks = body.adminRemarks;
                serviceTicket.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
                const done = yield serviceTicket.save();
                if (!done) {
                    res.status(400).json({ message: 'Error [assignServiceEngineer]: Something went wrong.' });
                    return;
                }
                let requestor = '';
                if (serviceTicket.createdBy)
                    requestor = serviceTicket.createdBy.toString();
                const message = `A service engineer is assigned to ${serviceTicket.ticketNo}.`;
                yield (0, notification_1.createNotification)(requestor, serviceTicketId, serviceTicket.ticketNo, message);
                const message2 = `You are assigned as service engineer for ${serviceTicket.ticketNo}.`;
                yield (0, notification_1.createNotification)(serviceTicket.serviceEngineer.toString(), serviceTicketId, serviceTicket.ticketNo, message2);
                res.status(200).json(serviceTicket);
                return;
            }
            res.status(500).json({ message: 'Error [assignServiceEngineer]: Something went wrong.' });
            return;
        }
        catch (error) {
            console.error(`Error [assignServiceEngineer]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function escalateService(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const serviceTicketId = req.params.serviceTicketId;
            const serviceTicket = yield ServiceTicket_1.default.findById(serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            if (serviceTicket.serviceEngineer && body.serviceEngineer && String(serviceTicket.serviceEngineer) !== String(body.serviceEngineer)) {
                const newServiceEngineer = yield User_1.default.findById(req.body.serviceEngineer);
                if (!newServiceEngineer) {
                    res.status(404).json({ message: '`Service Engineer` not found' });
                    return;
                }
                const oldServiceEngineer = yield User_1.default.findById(serviceTicket.serviceEngineer);
                if (!oldServiceEngineer) {
                    res.status(404).json({ message: '`Service Engineer` not found' });
                    return;
                }
                const user = yield User_1.default.findById(req.userId);
                if (!user) {
                    res.status(404).json({ message: '`User` not found' });
                    return;
                }
                const oldFullName = (0, utils_1.capitalizeFirstLetter)(oldServiceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(oldServiceEngineer.lastName);
                const newFullName = (0, utils_1.capitalizeFirstLetter)(newServiceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(newServiceEngineer.lastName);
                const userFullName = (0, utils_1.capitalizeFirstLetter)(user.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(user.lastName);
                req.serviceTicketId = serviceTicketId;
                req.logDetails = `Service is escalated from ${oldFullName} to ${newFullName} with ${body.priority} priority level by ${userFullName}.`;
                serviceTicket.serviceEngineer = new mongoose_1.Types.ObjectId(body.serviceEngineer);
                serviceTicket.serviceStatus = 'escalated';
                serviceTicket.priority = body.priority;
                serviceTicket.remarks = body.remarks;
                serviceTicket.adminRemarks = body.adminRemarks;
                serviceTicket.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
                const done = yield serviceTicket.save();
                if (!done) {
                    res.status(400).json({ message: 'Error [escalateService]: Something went wrong.' });
                    return;
                }
                let requestor = '';
                if (serviceTicket.createdBy)
                    requestor = serviceTicket.createdBy.toString();
                const message = `${serviceTicket.ticketNo} has been escalated to other service engineer.`;
                yield (0, notification_1.createNotification)(requestor, serviceTicketId, serviceTicket.ticketNo, message);
                const message1 = `${serviceTicket.ticketNo} has been escalated to you.`;
                yield (0, notification_1.createNotification)(newServiceEngineer._id.toString(), serviceTicketId, serviceTicket.ticketNo, message1);
                const message2 = `You have been removed as service engineer for ${serviceTicket.ticketNo} and escalated to another service engineer.`;
                yield (0, notification_1.createNotification)(oldServiceEngineer._id.toString(), serviceTicketId, serviceTicket.ticketNo, message2);
                res.status(200).json(serviceTicket);
                return;
            }
            res.status(500).json({ message: 'Error [escalateService]: Something went wrong.' });
            return;
        }
        catch (error) {
            console.error(`Error [escalateService]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function inputFindings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const serviceTicketId = req.params.serviceTicketId;
            const serviceTicket = yield ServiceTicket_1.default.findById(serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            const assignedServiceEngineer = yield User_1.default.findById(serviceTicket.serviceEngineer);
            if (!assignedServiceEngineer) {
                res.status(404).json({ message: '`Assigned Service Engineer` not found' });
                return;
            }
            const serviceEngineerName = (0, utils_1.capitalizeFirstLetter)(assignedServiceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(assignedServiceEngineer.lastName);
            serviceTicket.defectsFound = body.findings;
            serviceTicket.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
            const done = yield serviceTicket.save();
            if (!done) {
                res.status(400).json({ message: 'Error [inputFindings]: Something went wrong.' });
                return;
            }
            let requestor = '';
            if (serviceTicket.createdBy)
                requestor = serviceTicket.createdBy.toString();
            const message = `Service engineer for ${serviceTicket.ticketNo} had set its findings.`;
            yield (0, notification_1.createNotification)(requestor, serviceTicketId, serviceTicket.ticketNo, message);
            req.serviceTicketId = serviceTicketId;
            req.logDetails = `Diagnosis / findings is set to "${serviceTicket.defectsFound}" by ${serviceEngineerName}`;
            res.status(200).json(serviceTicket);
            return;
        }
        catch (error) {
            console.error(`Error [inputFindings]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function inputServiceRendered(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const serviceTicketId = req.params.serviceTicketId;
            const serviceTicket = yield ServiceTicket_1.default.findById(serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            const assignedServiceEngineer = yield User_1.default.findById(serviceTicket.serviceEngineer);
            if (!assignedServiceEngineer) {
                res.status(404).json({ message: '`Assigned Service Engineer` not found' });
                return;
            }
            const serviceEngineerName = (0, utils_1.capitalizeFirstLetter)(assignedServiceEngineer.firstName) + ' ' + (0, utils_1.capitalizeFirstLetter)(assignedServiceEngineer.lastName);
            serviceTicket.serviceRendered = body.serviceRendered;
            serviceTicket.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
            const done = yield serviceTicket.save();
            if (!done) {
                res.status(400).json({ message: 'Error [inputFindings]: Something went wrong.' });
                return;
            }
            let requestor = '';
            if (serviceTicket.createdBy)
                requestor = serviceTicket.createdBy.toString();
            const message = `Service engineer for ${serviceTicket.ticketNo} has rendered its service/action taken.`;
            yield (0, notification_1.createNotification)(requestor, serviceTicketId, serviceTicket.ticketNo, message);
            req.serviceTicketId = serviceTicketId;
            req.logDetails = `Service rendered / action taken is set to "${serviceTicket.serviceRendered}" by ${serviceEngineerName}.`;
            res.status(200).json(serviceTicket);
            return;
        }
        catch (error) {
            console.error(`Error [inputServiceRendered]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getRequestedServiceTickets(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentUser = yield User_1.default.findById(req.userId);
            if (currentUser && currentUser.role !== 'user') {
                res.status(403).json({ message: 'Unauthorized access' });
                return;
            }
            // const serviceTickets = await ServiceTicket.find({ createdBy: req.userId, serviceStatus: {$ne: 'closed'} })
            const serviceTickets = yield ServiceTicket_1.default.find({ createdBy: req.userId, rating: { $eq: "" } })
                .populate('client').populate({ path: 'serviceEngineer', select: '-password' }).sort({ createdAt: -1 });
            res.status(200).json(serviceTickets);
        }
        catch (error) {
            console.error(`Error [getRequestedServiceTickets]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getAssignedServiceTickets(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentUser = yield User_1.default.findById(req.userId).sort();
            if (currentUser && currentUser.role === 'user') {
                res.status(403).json({ message: 'Unauthorized access' });
                return;
            }
            const serviceTickets = yield ServiceTicket_1.default.find({ serviceEngineer: req.userId, serviceStatus: { $ne: 'closed' } }).sort({ createdAt: -1 });
            res.status(200).json(serviceTickets);
        }
        catch (error) {
            console.error(`Error [getAssignedServiceTickets]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getAssignedClosedServiceTickets(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentUser = yield User_1.default.findById(req.userId).sort();
            if (currentUser && currentUser.role === 'user') {
                res.status(403).json({ message: 'Unauthorized access' });
                return;
            }
            const serviceTickets = yield ServiceTicket_1.default.find({ serviceEngineer: req.userId, serviceStatus: 'closed' }).sort({ createdAt: -1 });
            res.status(200).json(serviceTickets);
        }
        catch (error) {
            console.error(`Error [getAssignedServiceTickets]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getTotalServiceStatuses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { totalTickets, totalOpenedTickets, totalAssignedTickets, totalInProgressTickets, totalOnHoldTickets, totalEscalatedTickets, totalCanceledTickets, totalReOpenedTickets, totalResolvedTickets, totalClosedTickets, } = req.query;
            let result = {};
            if (totalTickets) {
                const total = yield ServiceTicket_1.default
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalTickets: total });
            }
            if (totalOpenedTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'open' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalOpenedTickets: total });
            }
            if (totalAssignedTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'assigned' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalAssignedTickets: total });
            }
            if (totalInProgressTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'in progress' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalInProgressTickets: total });
            }
            if (totalOnHoldTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'on hold' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalOnHoldTickets: total });
            }
            if (totalEscalatedTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'escalated' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalEscalatedTickets: total });
            }
            if (totalCanceledTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'canceled' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalCanceledTickets: total });
            }
            if (totalReOpenedTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'reopened' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalReOpenedTickets: total });
            }
            if (totalResolvedTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'resolved' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalResolvedTickets: total });
            }
            if (totalClosedTickets) {
                const total = yield ServiceTicket_1.default
                    .find({ serviceStatus: 'closed' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalClosedTickets: total });
            }
            res.json(result);
        }
        catch (error) {
            console.error(`Error [getTotalServiceStatuses]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getTotalTaskTypes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { totalTickets, totalIncident, totalServiceRequest, totalAssetRequest, totalMaintenance, totalConsultation, totalAccessibility, } = req.query;
            let result = {};
            if (totalTickets) {
                const total = yield ServiceTicket_1.default
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalTickets: total });
            }
            if (totalIncident) {
                const total = yield ServiceTicket_1.default
                    .find({ taskType: 'incident' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalIncident: total });
            }
            if (totalServiceRequest) {
                const total = yield ServiceTicket_1.default
                    .find({ taskType: 'service request' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalServiceRequest: total });
            }
            if (totalAssetRequest) {
                const total = yield ServiceTicket_1.default
                    .find({ taskType: 'asset request' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalAssetRequest: total });
            }
            if (totalMaintenance) {
                const total = yield ServiceTicket_1.default
                    .find({ taskType: 'maintenace' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalMaintenance: total });
            }
            if (totalConsultation) {
                const total = yield ServiceTicket_1.default
                    .find({ taskType: 'consultation' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalConsultation: total });
            }
            if (totalAccessibility) {
                const total = yield ServiceTicket_1.default
                    .find({ taskType: 'accessibility' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalAccessibility: total });
            }
            res.json(result);
        }
        catch (error) {
            console.error(`Error [getTotalTaskTypes]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getTotalEquipmentTypes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { totalTickets, totalComputer, totalPrinter, totalScanner, totalMobileDevice, totalNetworkRelated, totalSoftwareApplication, totalOthers, } = req.query;
            let result = {};
            if (totalTickets) {
                const total = yield ServiceTicket_1.default
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalTickets: total });
            }
            if (totalComputer) {
                const total = yield ServiceTicket_1.default
                    .find({ equipmentType: 'computer' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalComputer: total });
            }
            if (totalPrinter) {
                const total = yield ServiceTicket_1.default
                    .find({ equipmentType: 'printer' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalPrinter: total });
            }
            if (totalScanner) {
                const total = yield ServiceTicket_1.default
                    .find({ equipmentType: 'scanner' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalScanner: total });
            }
            if (totalMobileDevice) {
                const total = yield ServiceTicket_1.default
                    .find({ equipmentType: 'mobile device' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalMobileDevice: total });
            }
            if (totalNetworkRelated) {
                const total = yield ServiceTicket_1.default
                    .find({ equipmentType: 'network related' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalNetworkRelated: total });
            }
            if (totalSoftwareApplication) {
                const total = yield ServiceTicket_1.default
                    .find({ equipmentType: 'software application' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalSoftwareApplication: total });
            }
            if (totalOthers) {
                const total = yield ServiceTicket_1.default
                    .find({ equipmentType: 'others' })
                    .countDocuments();
                result = Object.assign(Object.assign({}, result), { totalOthers: total });
            }
            res.json(result);
        }
        catch (error) {
            console.error(`Error [getTotalEquipmentTypes]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getSearchedTicketNo(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { v } = req.query;
            const filter = {};
            if (v)
                filter.ticketNo = { $regex: `^${v}`, $options: 'i' };
            const serviceTicket = yield ServiceTicket_1.default.find(filter)
                .populate({
                path: 'client',
                populate: [
                    { path: 'office' },
                    { path: 'designation' },
                ]
            }).populate('serviceEngineer').sort({ createdAt: -1 });
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            res.json(serviceTicket);
        }
        catch (error) {
            console.error(`Error [getSearchedTicketNo]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function setServiceRating(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { rating, ratingComment } = req.body;
            const serviceTicket = yield ServiceTicket_1.default.findById(req.params.serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            serviceTicket.rating = rating;
            serviceTicket.ratingComment = ratingComment;
            const done = yield serviceTicket.save();
            if (done) {
                const message = `Ticket owner provided a rating/feedback to your service performance.`;
                yield (0, notification_1.createNotification)(serviceTicket.serviceEngineer ? serviceTicket.serviceEngineer.toString() : '', serviceTicket._id ? serviceTicket._id.toString() : '', serviceTicket.ticketNo, message);
                req.logDetails = `Ticket owner provided a feedback to the service(s) with a rating of ${rating} stars and a feedback/comment: "${ratingComment}."`;
                res.status(200).json(serviceTicket);
            }
            else {
                res.status(400).json({ message: 'Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [setServiceRating]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function closeTicket(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const serviceTicket = yield ServiceTicket_1.default.findById(req.params.serviceTicketId);
            if (!serviceTicket) {
                res.status(404).json({ message: '`Service Ticket` not found' });
                return;
            }
            const authenticatedUser = yield User_1.default.findById(req.userId);
            if (!authenticatedUser) {
                res.status(404).json({ message: '`User` not found' });
                return;
            }
            serviceTicket.serviceStatus = 'closed';
            const done = yield serviceTicket.save();
            if (done) {
                req.serviceTicketId = req.params.serviceTicketId;
                req.logDetails = `Ticket has been closed by ${(0, utils_1.capitalizeFirstLetter)(authenticatedUser.firstName)} ${(0, utils_1.capitalizeFirstLetter)(authenticatedUser.lastName)}.`;
                res.status(200).json(serviceTicket);
            }
            else {
                res.status(400).json({ message: 'Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [closeTicket]: ${error}`);
            res.status(400).json(error);
        }
    });
}
