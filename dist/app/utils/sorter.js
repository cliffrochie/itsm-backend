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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(sort) {
    return __awaiter(this, void 0, void 0, function* () {
        let sortResult = {};
        if (sort)
            if (sort.includes('-')) {
                let data = sort.split('-')[sort.split('-').length - 1];
                sortResult[data] = -1;
            }
            else {
                sortResult[sort] = 1;
            }
        return sortResult;
    });
}
// export default async function<T extends object>(sort: string | undefined): Promise<T> {
//   if(!sort) return {} as T
//   if(sort.includes('-')) {
//     let d: string = sort.split('-')[sort.split('-').length-1]
//     return { [d]: -1 } as T
//   }
//   return { [sort]: 1 } as T
// }
