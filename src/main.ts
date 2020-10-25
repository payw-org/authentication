import { env } from '@/env'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import express from 'express'
import { apiRouter } from './api'

const dev = process.env.NODE_ENV === 'development'

const server = express()

server.use(bodyParser.json())
server.use(apiRouter)

// const port = dev ? 4000 : 15100
const port = dev ? env.port.dev : env.port.prod

server.listen(port, () => {
  console.log(`${chalk.yellow('server')} - listening on port ${port}`)
})
