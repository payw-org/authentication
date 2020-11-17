import express from 'express'
import { authRouter } from './auth'
import { verificationRouter } from './verification'

const apiRouter = express.Router()

apiRouter.use(authRouter)
apiRouter.use(verificationRouter)

export { apiRouter }
