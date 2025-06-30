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
exports.getOffices = getOffices;
exports.getOffice = getOffice;
exports.createOffice = createOffice;
exports.updateOffice = updateOffice;
exports.removeOffice = removeOffice;
const sorter_1 = __importDefault(require("../utils/sorter"));
const Office_1 = __importDefault(require("../models/Office"));
const mongoose_1 = require("mongoose");
function getOffices(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, alias, officeType, includes, noPage } = req.query;
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(req.query.sort);
            if (name)
                filter.name = { $regex: name + '.*', $options: 'i' };
            if (alias)
                filter.alias = { $regex: alias + '.*', $options: 'i' };
            if (officeType)
                filter.officeType = { $regex: officeType + '.*', $options: 'i' };
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;
            let offices = [];
            if (noPage) {
                if (includes === 'parentOffice') {
                    offices = yield Office_1.default.find(filter).populate('parentOffice').sort(sortResult);
                }
                else {
                    offices = yield Office_1.default.find(filter).sort(sortResult);
                }
                res.json(offices);
                return;
            }
            if (includes === 'parentOffice') {
                offices = yield Office_1.default.find(filter).populate('parentOffice').sort(sortResult).skip(skip).limit(limit);
            }
            else {
                offices = yield Office_1.default.find(filter).sort(sortResult).skip(skip).limit(limit);
            }
            const total = yield Office_1.default.find(filter).countDocuments();
            const results = { results: offices, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getOffices]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getOffice(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const officeId = req.params.officeId;
            const office = yield Office_1.default.findById(officeId);
            if (!office) {
                res.status(404).json({ message: '`Office` not found' });
                return;
            }
            res.json(office);
        }
        catch (error) {
            console.error(`Error [getOffice]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function createOffice(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const office = new Office_1.default({
                name: body.name,
                alias: body.alias,
                officeType: body.officeType,
                parentOffice: body.parentOffice ? new mongoose_1.Types.ObjectId(body.parentOffice) : undefined,
                createdBy: req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined
            });
            yield office.save();
            res.status(201).json(office);
        }
        catch (error) {
            console.error(`Error [createOffice]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateOffice(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const officeId = req.params.officeId;
            const office = yield Office_1.default.findById(officeId);
            if (!office) {
                res.status(404).json({ message: '`Office` not found' });
                return;
            }
            office.name = body.name;
            office.alias = body.alias;
            office.officeType = body.officeType;
            office.parentOffice = body.parentOffice ? new mongoose_1.Types.ObjectId(body.parentOffice) : undefined;
            office.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
            yield office.save();
            res.json(office);
        }
        catch (error) {
            console.error(`Error [updateOffice]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function removeOffice(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const officeId = req.params.officeId;
            const deleted = yield Office_1.default.findByIdAndDelete(officeId);
            if (deleted) {
                res.status(204).json({});
            }
            else {
                res.status(500).json({ message: 'Error [removeOffice]: Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [removeOffice]: ${error}`);
            res.status(400).json(error);
        }
    });
}
