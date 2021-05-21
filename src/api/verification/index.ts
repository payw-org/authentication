import { examineToken } from '@/middleware'
import {
  revokeRefreshToken,
  signAccessToken,
  verifyToken,
} from '@/modules/auth'
import { createHandler } from '@/modules/express-helper'
import { makeBody, makeHeader } from '@/modules/express-validator'
import express from 'express'

const body = makeBody<VerificationRequestHeaderAuthorization>()
const header = makeHeader<{ authorization: string }>()

const verificationRouter = express.Router()

verificationRouter.use(examineToken)

type VerificationRequestHeaderAuthorization = {
  accessToken: string
  refreshToken: string
}

verificationRouter.post(
  `/verify`,
  createHandler(async ({ req, res }) => {
    const accessToken = req.token

    console.log(`accessToken: ${accessToken}`)

    const [accessTokenErr, authData] = await verifyToken(accessToken, 'access')

    if (accessTokenErr === null) {
      res.json(authData)
      return
    }

    if (accessTokenErr.name !== 'TokenExpiredError') {
      res.sendStatus(401)
      return
    }

    // Access token expired

    console.log('expired')

    res.status(401).send({ expired: true })
  })
)

verificationRouter.post(
  `/refresh`,
  createHandler(async ({ req, res }) => {
    const refreshToken = req.token

    console.log(`refreshToken: ${refreshToken}`)

    console.log('try to refresh')

    const [refreshTokenErr, authData] = await verifyToken(
      refreshToken,
      'refresh'
    )

    if (refreshTokenErr || !authData) {
      res.sendStatus(401)
      return
    }

    const newAccessToken = signAccessToken({
      userID: authData.userID,
    })

    console.log(`newAccessToken: ${newAccessToken}`)

    res.json({ accessToken: newAccessToken })
  })
)

verificationRouter.post(
  `/revoke`,
  createHandler(async ({ req, res }) => {
    const refreshToken = req.token
    const [tokenErr, authData] = await verifyToken(refreshToken, 'refresh')

    if (tokenErr || !authData) {
      res.sendStatus(401)
      return
    }

    const newRefreshToken = await revokeRefreshToken({
      userID: authData.userID,
    })

    res.json({ refreshToken: newRefreshToken })
  })
)

export { verificationRouter }
