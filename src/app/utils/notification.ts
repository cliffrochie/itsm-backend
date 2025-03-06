import Notification from "../models/Notification"


export async function createNotification(userId: string, ticketNo: string, message: string) {
  try {
    const data = new Notification({
      user: userId,
      message: message,
      ticketNo: ticketNo,
      isRead: false
    })

    await data.save()

    if(data) {
      return true
    }
    else {
      return false
    }
  }
  catch(error) {
    console.error(`Error [createNotification]: ${error}`)
    return error
  }
}