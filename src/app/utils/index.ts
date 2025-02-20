import { Types } from "mongoose"
import ServiceTicket from "../models/ServiceTicket"
import ServiceTicketHistory from "../models/ServiceTicketHistory"
import { Request } from "express"
import { IUserRequest } from "../@types/IUser"
import { IServiceTicket } from "../@types/IServiceTicket"


export async function generateTicketNo() {
  const now = new Date()
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  
  
  console.log('start: ', startOfDay)
  console.log('end: ', endOfDay)

  let counter = ''
  const total = await ServiceTicket.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).countDocuments()

  console.log('total', total)

  if(total < 9) {
    counter = `00${total+1}`
  }
  else if(total < 99) {
    counter = `0${total+1}`
  }
  else if(total < 999) {
    counter = `${total+1}`
  }
  else {
    counter = (total+1).toString()
  }
  
  const formattedDate = endOfDay.toISOString().slice(2, 10)
  console.log('formatted date: ', formattedDate)
  let result = 'ITSM-'+ formattedDate.replace(/-/g, '') +'-'+ counter


  return result
}


export async function actionInterpretation(action: string) {
  switch(action) {
    case 'GET':
      return 'Retrieved'
      break
    case 'POST':
      return 'Created'
      break
    case 'PUT':
      return 'Updated'
      break
    case 'DELETE':
      return 'Removed'
      break
    default:
      return 'Unknown Action'
      break
  }
}


export function isNumeric(value: string) {
  return /^-?\d+$/.test(value);
}


export function capitalizeFirstLetter(val: string) {
  return val
    .split(' ') // Split the sentence into an array of words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
    .join(' '); 
}


export function capitalizeFirstLetterKebab(val: string) {
  return val
    .split('-') // Split the sentence into an array of words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(' '); 
}


export const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9]$/


export function getDateFormatYYYYMMDD() {
  const currentDate = new Date()
  const year = currentDate.getFullYear().toString().substring(2)
  const month = (currentDate.getMonth() + 1) < 10 ? `0${(currentDate.getMonth() + 1)}` : (currentDate.getMonth() + 1).toString()
  const date =  currentDate.getDate() < 10 ? `0${currentDate.getDate()}` : currentDate.getDate().toString()
  return year +'-'+ month + '-'+ date
}


export function changeDateFormatMMDDYYYY(date: Date) {  
  const year = date.getFullYear().toString()
  const month = date.getMonth() < 10 ? `0${date.getMonth() + 1}` : (date.getMonth() + 1).toString()
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate().toString()
  return month +'/'+ day +'/'+ year
}


export function generateTicket() {
  const currentDate = new Date()
  const year = currentDate.getFullYear().toString().substring(2)
  const month = (currentDate.getMonth() + 1) < 10 ? `0${(currentDate.getMonth() + 1)}` : (currentDate.getMonth() + 1).toString()
  const date =  currentDate.getDate() < 10 ? `0${currentDate.getDate()}` : currentDate.getDate().toString()
  const ticket = year + month + date + generateShortUUID(4).toUpperCase()
  return ticket
}


function generateShortUUID(length: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => b.toString(36).padStart(2, '0')) // Convert to base36 and pad
    .join('')
    .substring(0, length);
}


