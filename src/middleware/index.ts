import type { NextFunction, Request, Response } from 'express'

export const examineToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

  res.locals.token = token

  next()
}
