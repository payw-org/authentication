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
  jwt.sign(authData, env.auth.jwt.accessTokenSecret, {
    expiresIn: env.auth.jwt.accessTokenLifetime,
  })

export const signRefreshToken = (authData: AuthData) =>
  jwt.sign(authData, env.auth.jwt.refreshTokenSecret)

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
  token: string | null | undefined,
  type: 'access' | 'refresh'
): Promise<
  [
    jwt.JsonWebTokenError | jwt.NotBeforeError | jwt.TokenExpiredError | null,
    DecodedAuthData | undefined
  ]
> => {
  return new Promise((resolve) => {
    const secret =
      type === 'access'
        ? env.auth.jwt.accessTokenSecret
        : env.auth.jwt.refreshTokenSecret

    jwt.verify(token ?? '', secret, (err, decoded) => {
      resolve([err, decoded as DecodedAuthData | undefined])
    })
  })
}
