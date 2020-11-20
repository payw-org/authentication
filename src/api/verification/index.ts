import { examineToken } from '@/middleware'
import { verifyToken } from '@/modules/auth'
import { makeBody, makeHeader, validate } from '@/modules/express-validator'
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

// TODO: validate from headers
verificationRouter.post(`/verify`, async (req: Request, res: Response) => {
  const accessToken = res.locals.token as string

  const [accessTokenErr, authDataFromAccessToken] = await verifyToken(
    accessToken,
    'access'
  )

  console.log(accessTokenErr)

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

  res.status(401).send({ shouldRefresh: true })

  // const [refreshTokenErr, authDataFromRefreshToken] = await verifyToken(
  //   refreshToken
  // )

  // if (refreshTokenErr || !authDataFromRefreshToken) {
  //   res.sendStatus(401)
  //   return
  // }

  // const foundUser = await prisma.user.findOne({
  //   where: {
  //     id: authDataFromRefreshToken.userID,
  //   },
  // })

  // if (!foundUser || foundUser.refreshToken !== refreshToken) {
  //   res.sendStatus(401)
  //   return
  // }

  // console.log(authDataFromRefreshToken)

  // const newAccessToken = signAccessToken({
  //   userID: authDataFromRefreshToken.userID,
  // })

  // console.log(newAccessToken)

  // res.json({
  //   accessToken: newAccessToken,
  // })
})

verificationRouter.post(
  `/refresh`,
  validate([header('authorization').isString()]),
  async (req: Request, res: Response) => {}
)

export { verificationRouter }
