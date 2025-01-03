import dotenv from 'dotenv'
dotenv.config()

export default async function () {
  try {
    await require('mongoose').connect(process.env.MONGODB_URL)
    console.log('Server connected to the database successfully!')
  }
  catch(error) {
    console.error(`Failed to connect: ${error}`)
  }
}