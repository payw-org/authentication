import { env } from '@/env'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

export type AuthData = {
  userID: number
}

export type DecodedAuthData = AuthData & {
  iat: number
  exp: number
}

const prisma = new PrismaClient()

export const signAccessToken = (authData: AuthData) =>
  jwt.sign(authData, env.auth.jwt.secretKey, {
    expiresIn: env.auth.jwt.accessTokenLifetime,
  })

export const signRefreshToken = (authData: AuthData) =>
  jwt.sign(authData, env.auth.jwt.secretKey)

export const revokeRefreshToken = async (authData: AuthData) => {
  const refreshToken = signRefreshToken(authData)

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
