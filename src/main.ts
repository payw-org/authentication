import { env } from '@/env'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import express from 'express'
import { apiRouter } from './api'
import { prisma } from './modules/prisma'

const dev = process.env.NODE_ENV === 'development'

const app = express()

app.use(bodyParser.json())
app.use(apiRouter)

const port = dev ? env.port.dev : env.port.prod

const server = app.listen(port, () => {
  console.log(`${chalk.yellow('server')} - listening on port ${port}`)
})

prisma.$on('beforeExit' as never, () => {
  prisma.$disconnect()
  server.close()
})
