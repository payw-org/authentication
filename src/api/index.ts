import express from 'express'
import { authRouter } from './auth'
import { testRouter } from './test'
import { verificationRouter } from './verification'

const apiRouter = express.Router()

apiRouter.use(testRouter)
apiRouter.use(authRouter)
apiRouter.use(verificationRouter)

export { apiRouter }
