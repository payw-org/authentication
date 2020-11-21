import { examineToken } from '@/middleware'
import { signAccessToken, verifyToken } from '@/modules/auth'
import { makeBody, makeHeader } from '@/modules/express-validator'
import { prisma } from '@/modules/prisma'
import type { Request, Response } from 'express'
import express from 'express'

const body = makeBody<VerificationRequestHeaderAuthorization>()
const header = makeHeader<{ authorization: string }>()

const verificationRouter = express.Router()

verificationRouter.use(examineToken)

type VerificationRequestHeaderAuthorization = {
  accessToken: string
  refreshToken: string
}

verificationRouter.post(`/verify`, async (req: Request, res: Response) => {
  const accessToken = res.locals.token as string

  const [accessTokenErr, authData] = await verifyToken(accessToken, 'access')

  console.log(accessTokenErr)

  console.log(authData)

  if (accessTokenErr === null) {
    res.json(authData)
    return
  }

  if (accessTokenErr.name !== 'TokenExpiredError') {
    res.sendStatus(401)
    return
  }

  // Access token expired

  res.status(401).send({ expired: true })
})

verificationRouter.post(`/refresh`, async (req: Request, res: Response) => {
  const refreshToken = res.locals.token as string

  const [refreshTokenErr, authData] = await verifyToken(refreshToken, 'refresh')

  if (refreshTokenErr || !authData) {
    res.sendStatus(401)
    return
  }

  const newAccessToken = signAccessToken({
    userID: authData.userID,
  })

  console.log(`newAccessToken: ${newAccessToken}`)

  res.json({
    accessToken: newAccessToken,
  })
  })

  if (!user || user.refreshToken !== refreshToken) {
    res.sendStatus(401)
    return
  }

  console.log(authData)

  const newAccessToken = signAccessToken({
    userID: authData.userID,
  })

  console.log(`newAccessToken: ${newAccessToken}`)

  res.json({
    accessToken: newAccessToken,
  })
})

export { verificationRouter }
