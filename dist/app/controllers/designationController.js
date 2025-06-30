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
exports.getDesignations = getDesignations;
exports.getDesignation = getDesignation;
exports.createDesignation = createDesignation;
exports.updateDesignation = updateDesignation;
exports.removeDesignation = removeDesignation;
const Designation_1 = __importDefault(require("../models/Designation"));
const sorter_1 = __importDefault(require("../utils/sorter"));
const mongoose_1 = require("mongoose");
function getDesignations(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { title, sort, noPage } = req.query;
            const filter = {};
            const sortResult = yield (0, sorter_1.default)(req.query.sort);
            if (title)
                filter.title = { $regex: title + '.*', $options: 'i' };
            const page = Number(req.query.page) || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;
            let designations = [];
            if (noPage) {
                designations = yield Designation_1.default.find(filter).sort(sortResult);
                res.json(designations);
                return;
            }
            designations = yield Designation_1.default.find(filter).sort(sortResult).skip(skip).limit(limit);
            const total = yield Designation_1.default.find(filter).countDocuments();
            const results = { results: designations, page, totalPages: Math.ceil(total / limit), total };
            res.json(results);
        }
        catch (error) {
            console.error(`Error [getDesignations]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function getDesignation(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const designationId = req.params.designationId;
            const designation = yield Designation_1.default.findById(designationId);
            if (!designation) {
                res.status(404).json({ message: '`Designation` not found' });
                return;
            }
            res.json(designation);
        }
        catch (error) {
            console.error(`Error [getDesignation]: ${error}`);
            res.json({ message: '[getDesignation] Server error', details: error });
        }
    });
}
function createDesignation(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const designation = new Designation_1.default({
                title: body.title,
                createdBy: req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined
            });
            yield designation.save();
            res.status(201).json(designation);
        }
        catch (error) {
            console.error(`Error [createDesignation]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function updateDesignation(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = req.body;
            const designationId = req.params.designationId;
            const designation = yield Designation_1.default.findById(designationId);
            if (!designation) {
                res.status(404).json({ message: '`Designation` not found' });
                return;
            }
            designation.title = body.title;
            designation.updatedBy = req.userId ? new mongoose_1.Types.ObjectId(req.userId) : undefined;
            yield designation.save();
            res.json(designation);
        }
        catch (error) {
            console.error(`Error [updateDesignation]: ${error}`);
            res.status(400).json(error);
        }
    });
}
function removeDesignation(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const designationId = req.params.designationId;
            const deleted = yield Designation_1.default.findByIdAndDelete(designationId);
            if (deleted) {
                res.status(204).json({});
            }
            else {
                res.status(500).json({ message: 'Error [removeDesignation]: Something went wrong.' });
            }
        }
        catch (error) {
            console.error(`Error [removeDesignation]: ${error}`);
            res.status(400).json(error);
        }
    });
}
