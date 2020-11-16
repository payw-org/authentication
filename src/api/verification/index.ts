import { signAccessToken, verifyToken } from '@/modules/auth'
import { makeBody, makeHeader, validate } from '@/modules/express-validator'
import { prisma } from '@/modules/prisma'
import type { Request, Response } from 'express'
import express from 'express'

const body = makeBody<VerificationRequestHeaderAuthorization>()
const header = makeHeader<VerificationRequestHeaderAuthorization>()

const verificationRouter = express.Router()

type VerificationRequestHeaderAuthorization = {
  accessToken: string
  refreshToken: string
}

// TODO: validate from headers
verificationRouter.post(
  `/verify`,
  validate([body('accessToken').isString(), body('refreshToken').isString()]),
  async (req: Request, res: Response) => {
    const {
      accessToken,
      refreshToken,
    } = req.body as VerificationRequestHeaderAuthorization

    const [accessTokenErr, authDataFromAccessToken] = await verifyToken(
      accessToken
    )

    console.log(authDataFromAccessToken)

    if (accessTokenErr === null) {
      res.json(authDataFromAccessToken)
      return
    }

    if (accessTokenErr.name !== 'TokenExpiredError') {
      res.sendStatus(401)
      return
    }

    // Access token expired

    const [refreshTokenErr, authDataFromRefreshToken] = await verifyToken(
      refreshToken
    )

    if (refreshTokenErr || !authDataFromRefreshToken) {
      res.sendStatus(401)
      return
    }

    const foundUser = await prisma.user.findOne({
      where: {
        id: authDataFromRefreshToken.userID,
      },
    })

    if (!foundUser || foundUser.refreshToken !== refreshToken) {
      res.sendStatus(401)
      return
    }

    console.log(authDataFromRefreshToken)

    const newAccessToken = signAccessToken({
      userID: authDataFromRefreshToken.userID,
    })

    console.log(newAccessToken)

    res.json({
      accessToken: newAccessToken,
    })
  }
)

export { verificationRouter }
