import { env } from '@/env'
import { AuthData } from '@/types'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export const signAccessToken = (authData: AuthData) =>
  jwt.sign(authData, env.auth.jwt.secretKey, {
    expiresIn: env.auth.jwt.accessTokenLifetime,
  })

export const signRefreshToken = async (authData: AuthData) => {
  const refreshToken = jwt.sign(authData, env.auth.jwt.secretKey)

  await prisma.user.update({
    data: {
      refreshToken,
    },
    where: {
      id: authData.userID,
    },
  })

  return refreshToken
}

export const verifyToken = (token: string) =>
  jwt.verify(token, env.auth.jwt.secretKey) as AuthData
