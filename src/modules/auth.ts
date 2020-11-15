import { env } from '@/env'
import { PrismaClient } from '@prisma/client'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'

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

export type JWTError = JsonWebTokenError & {
  name: 'TokenExpiredError' | 'JsonWebTokenError' | 'NotBeforeError'
}

export const verifyToken = (
  token: string
): Promise<
  [
    jwt.JsonWebTokenError | jwt.NotBeforeError | jwt.TokenExpiredError | null,
    DecodedAuthData | undefined
  ]
> => {
  return new Promise((resolve) => {
    jwt.verify(token, env.auth.jwt.secretKey, (err, decoded) => {
      resolve([err, decoded as DecodedAuthData | undefined])
    })
  })
}
