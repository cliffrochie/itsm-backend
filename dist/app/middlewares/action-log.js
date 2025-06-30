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
const ActionLog_1 = __importDefault(require("../models/ActionLog"));
const logMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.on('finish', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const logEntry = new ActionLog_1.default({
                url: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode,
                userId: req.userId ? req.userId : 'guest',
                ip: req.ip,
                body: req.body,
                query: req.query,
                params: req.params,
                timestamp: new Date()
            });
            yield logEntry.save();
        }
        catch (err) {
            console.error('Error saving action log: ', err);
        }
    }));
    next();
});
exports.default = logMiddleware;
