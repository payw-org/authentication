import { env } from '@/env'
import { PrismaClient } from '@prisma/client'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'

export type AuthData = {
  userID: number
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

/**
 * Validates refresh token itself and also checks DB.
 */
export const verifyToken = (
  token: string | null | undefined,
  type: 'access' | 'refresh'
): Promise<[Error | null, AuthData | undefined]> => {
  return new Promise((resolve) => {
    const secret =
      type === 'access'
        ? env.auth.jwt.accessTokenSecret
        : env.auth.jwt.refreshTokenSecret

    jwt.verify(token ?? '', secret, async (err, decoded) => {
      if (decoded) {
        const authData = decoded as AuthData & { iat?: number; exp?: number }

        delete authData.iat
        delete authData.exp

        // Check DB and compare the refresh token
        if (authData?.userID && type === 'refresh') {
          const user = await prisma.user.findUnique({
            where: {
              id: authData.userID,
            },
          })

          if (user?.refreshToken !== token) {
            const err = new Error('Revoked Refresh Token')

            err.name = 'RevokedRefreshToken'

            resolve([err, undefined])
            return
          }
        }

        resolve([err, authData as AuthData])
      } else {
        resolve([err, decoded as undefined])
      }
    })
  })
}
