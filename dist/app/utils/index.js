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
exports.timeRegex = void 0;
exports.generateTicketNo = generateTicketNo;
exports.generateTicket = generateTicket;
exports.actionInterpretation = actionInterpretation;
exports.isNumeric = isNumeric;
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.capitalizeFirstLetterKebab = capitalizeFirstLetterKebab;
exports.getDateFormatYYYYMMDD = getDateFormatYYYYMMDD;
exports.changeDateFormatMMDDYYYY = changeDateFormatMMDDYYYY;
exports.toUpper = toUpper;
const ServiceTicket_1 = __importDefault(require("../models/ServiceTicket"));
const TicketCounter_1 = __importDefault(require("../models/TicketCounter"));
function generateTicketNo() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        let counter = '';
        const total = yield ServiceTicket_1.default.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).countDocuments();
        console.log('total', total);
        if (total < 9) {
            counter = `00${total + 1}`;
        }
        else if (total < 99) {
            counter = `0${total + 1}`;
        }
        else if (total < 999) {
            counter = `${total + 1}`;
        }
        else {
            counter = (total + 1).toString();
        }
        const formattedDate = endOfDay.toISOString().slice(2, 10);
        console.log('formatted date: ', formattedDate);
        let result = 'ITSM-' + formattedDate.replace(/-/g, '') + '-' + counter;
        return result;
    });
}
function generateTicket(equipmentType, taskType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const E = equipmentType.charAt(0).toUpperCase();
            const T = taskType.charAt(0).toUpperCase();
            const now = new Date();
            const year = now.getFullYear();
            const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
            const formattedDate = endOfDay.toISOString().slice(2, 10);
            const ticketCounter = yield TicketCounter_1.default.findOne({ year: year });
            if (!ticketCounter) {
                const newTicketCounter = new TicketCounter_1.default({ year: year, counter: 1 });
                yield newTicketCounter.save();
                return `${E}${T}-${formattedDate.replace(/-/g, '')}-${formatCounter(newTicketCounter.counter ? newTicketCounter.counter : 0)}`;
            }
            ticketCounter.counter += 1;
            const done = yield ticketCounter.save();
            if (done) {
                const result = `${E}${T}-${formattedDate.replace(/-/g, '')}-${formatCounter(ticketCounter.counter)}`;
                return result;
            }
            else {
                return 0;
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
function formatCounter(counter) {
    let result = '';
    if (counter < 9) {
        result = `000${counter}`;
    }
    else if (counter < 99) {
        result = `00${counter}`;
    }
    else if (counter < 999) {
        result = `0${counter}`;
    }
    else if (counter < 9999) {
        result = `${counter}`;
    }
    else {
        result = (counter).toString();
    }
    return result;
}
function actionInterpretation(action) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (action) {
            case 'GET':
                return 'Retrieved';
                break;
            case 'POST':
                return 'Created';
                break;
            case 'PUT':
                return 'Updated';
                break;
            case 'DELETE':
                return 'Removed';
                break;
            default:
                return 'Unknown Action';
                break;
        }
    });
}
function isNumeric(value) {
    return /^-?\d+$/.test(value);
}
function capitalizeFirstLetter(val) {
    return val
        .split(' ') // Split the sentence into an array of words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' ');
}
function capitalizeFirstLetterKebab(val) {
    return val
        .split('-') // Split the sentence into an array of words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
        .join(' ');
}
exports.timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9]$/;
function getDateFormatYYYYMMDD() {
    const currentDate = new Date();
    const year = currentDate.getFullYear().toString().substring(2);
    const month = (currentDate.getMonth() + 1) < 10 ? `0${(currentDate.getMonth() + 1)}` : (currentDate.getMonth() + 1).toString();
    const date = currentDate.getDate() < 10 ? `0${currentDate.getDate()}` : currentDate.getDate().toString();
    return year + '-' + month + '-' + date;
}
function changeDateFormatMMDDYYYY(date) {
    const year = date.getFullYear().toString();
    const month = date.getMonth() < 10 ? `0${date.getMonth() + 1}` : (date.getMonth() + 1).toString();
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate().toString();
    return month + '/' + day + '/' + year;
}
function generateShortUUID(length) {
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map((b) => b.toString(36).padStart(2, '0')) // Convert to base36 and pad
        .join('')
        .substring(0, length);
}
function toUpper(v) {
    var _a;
    return ((_a = v === null || v === void 0 ? void 0 : v.toUpperCase) === null || _a === void 0 ? void 0 : _a.call(v)) || '';
}
