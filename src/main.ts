import { env } from '@/env'
import appRoot from 'app-root-path'
import chalk from 'chalk'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { apiRouter } from './api'
import { corsAllowedList } from './constants'

const dev = process.env.NODE_ENV === 'development'

const app = express()

app.use(cookieParser())

const corsHandler = dev
  ? cors({ credentials: true, origin: ['http://localhost:3000'] })
  : cors({ credentials: true, origin: corsAllowedList })

app.use(corsHandler)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(appRoot.resolve('public')))
app.use(apiRouter)

const port = dev ? env.port.dev : env.port.prod

const server = app.listen(port, () => {
  console.log(`${chalk.yellow('server')} - listening on port ${port}`)
})

process.on('SIGTERM', () => {
  process.exit()
})
