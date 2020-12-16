import { createHandler } from '@/modules/express-helper'
import { PAYWAuth } from 'client'
import express from 'express'

export const testRouter = express.Router()

testRouter.get(
  '/client/test',
  createHandler(async ({ req, res }) => {
    const paywAuth = PAYWAuth(req, res)

    const result = await paywAuth.verify()

    res.send(result)
  })
)
