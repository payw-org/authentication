import type { NextFunction, Request, Response } from 'express'

export const createHandler = (
  handler: (ctx: { req: Request; res: Response; next: NextFunction }) => any
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    handler({ req, res, next })
  }
}
