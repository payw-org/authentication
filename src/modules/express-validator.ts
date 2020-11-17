import type { NextFunction, Request, Response } from 'express'
import type { ValidationChain } from 'express-validator'
import { body, header, validationResult } from 'express-validator'

type ValidationChainFunction<T extends object> = (
  fields?: keyof T | (keyof T)[] | undefined,
  message?: any
) => ValidationChain

export const makeBody = <T extends object>() =>
  body as ValidationChainFunction<T>

export const makeHeader = <T extends object>() =>
  header as ValidationChainFunction<T>

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)))

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    res.status(400).json({ errors: errors.array() })
  }
}
