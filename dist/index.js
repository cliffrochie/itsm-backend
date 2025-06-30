"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const createApp_1 = require("./createApp");
dotenv_1.default.config();
const app = (0, createApp_1.createApp)();
const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => console.log(`Server is listening to http://0.0.0.0:${port}`));
