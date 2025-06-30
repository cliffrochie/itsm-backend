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
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const database_1 = __importDefault(require("./config/database"));
const userRouter_1 = __importDefault(require("./app/routers/userRouter"));
const designationRouter_1 = __importDefault(require("./app/routers/designationRouter"));
const officeRouter_1 = __importDefault(require("./app/routers/officeRouter"));
const clientRouter_1 = __importDefault(require("./app/routers/clientRouter"));
const serviceTicketRouter_1 = __importDefault(require("./app/routers/serviceTicketRouter"));
const serviceTicketHistoryRouter_1 = __importDefault(require("./app/routers/serviceTicketHistoryRouter"));
const ticketCounterRouter_1 = __importDefault(require("./app/routers/ticketCounterRouter"));
const notificationRouter_1 = __importDefault(require("./app/routers/notificationRouter"));
const action_log_1 = __importDefault(require("./app/middlewares/action-log"));
function createApp() {
    dotenv_1.default.config();
    (0, database_1.default)();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3500',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.json());
    app.use(action_log_1.default);
    app.use('/api/users', userRouter_1.default);
    app.use('/api/designations', designationRouter_1.default);
    app.use('/api/offices', officeRouter_1.default);
    app.use('/api/clients', clientRouter_1.default);
    app.use('/api/service-tickets', serviceTicketRouter_1.default);
    app.use('/api/service-ticket-histories', serviceTicketHistoryRouter_1.default);
    app.use('/api/ticket-counters', ticketCounterRouter_1.default);
    app.use('/api/notifications', notificationRouter_1.default);
    app.get('/', (req, res) => __awaiter(this, void 0, void 0, function* () {
        res.json({ message: 'hello it service ticket' });
    }));
    return app;
}
