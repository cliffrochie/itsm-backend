import dotenv from 'dotenv'
import { createApp } from "./createApp"


dotenv.config()

const app = createApp()

const port: number = Number(process.env.PORT) || 8080

app.listen(port, () => console.log(`Server is listening to http://localhost:${port}`))