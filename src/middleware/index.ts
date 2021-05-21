import { cookieNames } from 'client'
import type { NextFunction, Request, Response } from 'express'

export const examineToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If token exists in cookie
  const accessToken = req.cookies[cookieNames.accessToken]
  const refreshToken = req.cookies[cookieNames.refreshToken]

  if (req.url === '/refresh' && refreshToken) {
    req.token = refreshToken
    return next()
  } else if (accessToken) {
    req.token = accessToken
    return next()
  }

  // If token does not exist in cookie,
  // parse the authorization header
  const authorization = req.headers.authorization

  if (!authorization || typeof authorization !== 'string') {
    res.sendStatus(401)
    return
  }

  const splittedAuth = authorization.split(' ')

  const bearerPart = splittedAuth[0]
  const token = splittedAuth[1]

  if (bearerPart !== 'Bearer' || !token) {
    res.sendStatus(401)
    return
  }

  req.token = token

  next()
}
