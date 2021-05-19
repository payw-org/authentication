import { env } from '@/env'
import appRoot from 'app-root-path'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import cors from 'cors'
import express from 'express'
import { apiRouter } from './api'
import { corsAllowedList } from './constants'

const dev = process.env.NODE_ENV === 'development'

const app = express()

const corsHandler = dev ? cors() : cors({ origin: corsAllowedList })

app.use(corsHandler)

app.use(bodyParser.json())
app.use(express.static(appRoot.resolve('public')))
app.use(apiRouter)

const port = dev ? env.port.dev : env.port.prod

const server = app.listen(port, () => {
  console.log(`${chalk.yellow('server')} - listening on port ${port}`)
})

process.on('SIGTERM', () => {
  process.exit()
})
