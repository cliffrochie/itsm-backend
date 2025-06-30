"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
function default_1(req, res, next) {
    try {
        const token = req.cookies.token;
        // console.log(token)
        if (!jsonwebtoken_1.default.verify(token, String(process.env.SECRET_KEY) || 'notsosecret')) {
            res.status(403).json({ message: 'Invalid token!' });
            return;
        }
        const payload = jsonwebtoken_1.default.decode(token);
        // console.log('#####')
        // console.log(payload)
        if (!payload) {
            res.status(403).json({ message: 'Invalid token!!' });
            return;
        }
        req.userId = payload.userId;
        next();
    }
    catch (error) {
        res.clearCookie('token');
        console.error(`Error [auth]: ${error}`);
        res.status(403).json({ message: 'Invalid token!!!' });
        return;
    }
}
