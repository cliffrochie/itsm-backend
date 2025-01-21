import ServiceTicket from "../models/ServiceTicket"


export async function generateTicketNo(date: string) {
  const [month, day, year] = date.split('/')

  let result = ''
  const total = await ServiceTicket.find({ date: { $regex: date + '.*', $options: 'i' } }).countDocuments()

  if(total < 9) {
    result = `000${total+1}`
  }
  else if(total < 99) {
    result = `00${total+1}`
  }
  else if(total < 999) {
    result = `0${total+1}`
  }
  else {
    result = (total+1).toString()
  }
  
  return 'ITSM'+ year.substring(2) + month + day + result
}