import dotenv from 'dotenv'
dotenv.config()

export default async function () {
  try {
    const connection = process.env.MONGODB_URL
    console.log('DB Link: ', connection)
    await require('mongoose').connect(connection)
    console.log('Server connected to the database successfully!')
  }
  catch(error) {
    console.error(`Failed to connect: ${error}`)
  }
}