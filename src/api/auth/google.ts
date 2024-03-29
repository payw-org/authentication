import { env } from '@/env'
import {
  AuthData,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '@/modules/auth'
import { isDev } from '@/modules/is-dev'
import { prisma } from '@/modules/prisma'
import { dbNow } from '@/modules/time'
import express from 'express'
import passport from 'passport'
import * as GoogleStrategy from 'passport-google-oauth'
import queryString from 'query-string'

const host =
  process.env.HOST === 'local'
    ? `http://localhost:${
        process.env.NODE_ENV === 'development' ? env.port.dev : env.port.prod
      }`
    : `https://auth.payw.org`

function makeGoogleAuthRouter({
  serviceName,
  redirectServiceURL,
}: {
  serviceName: string
  redirectServiceURL: string
}) {
  const redirectPath = `/google/redirect/${serviceName}`
  const redirectURL = `${host}${redirectPath}`
  const now = dbNow()

  passport.use(
    `google-${serviceName}`,
    new GoogleStrategy.OAuth2Strategy(
      {
        clientID: env.auth.google.clientID,
        clientSecret: env.auth.google.clientSecret,
        callbackURL: redirectURL,
      },
      async (...args) => {
        const profile: GoogleStrategy.Profile = args[2]
        const done: GoogleStrategy.VerifyFunction = args[3]

        if (
          !profile.emails ||
          (profile.emails && profile.emails.length === 0)
        ) {
          done(Error(`Email doesn't exist`))
          return
        }

        console.log(profile.emails[0])

        const existingUser = await prisma.user.findUnique({
          where: {
            email: profile.emails[0].value,
          },
        })

        if (existingUser) {
          let refreshToken = existingUser.refreshToken

          const [error] = await verifyToken(refreshToken, 'refresh')

          if (error) {
            refreshToken = signRefreshToken({ userID: existingUser.id })

            await prisma.user.update({
              data: {
                refreshToken,
              },
              where: {
                id: existingUser.id,
              },
            })
          }

          await prisma.registration.upsert({
            create: {
              userId: existingUser.id,
              service: serviceName,
              registeredAt: now,
            },
            update: {},
            where: {
              userId_service: {
                userId: existingUser.id,
                service: serviceName,
              },
            },
          })

          done(null, {
            refreshToken: refreshToken,
            accessToken: signAccessToken({ userID: existingUser.id }),
          })
        } else {
          const createdUser = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              registeredAt: now,
            },
          })

          const authData: AuthData = {
            userID: createdUser.id,
          }

          const refreshToken = signRefreshToken(authData)

          await prisma.user.update({
            data: {
              refreshToken,
            },
            where: {
              id: authData.userID,
            },
          })

          await prisma.registration.upsert({
            create: {
              userId: authData.userID,
              service: serviceName,
              registeredAt: dbNow(),
            },
            update: {},
            where: {
              userId_service: {
                userId: authData.userID,
                service: serviceName,
              },
            },
          })

          const payload = {
            refreshToken,
            accessToken: signAccessToken(authData),
          }

          done(null, payload)
        }
      }
    )
  )

  const googleAuthRouter = express.Router()

  googleAuthRouter.get(
    `/google/sign-up/${serviceName}`,
    passport.authenticate(`google-${serviceName}`, {
      scope: ['profile', 'email'],
      session: false,
    })
  )

  googleAuthRouter.get(redirectPath, (req, res, next) => {
    passport.authenticate(
      `google-${serviceName}`,
      {
        session: false,
      },
      async (
        err: Error,
        payload: { accessToken: string; refreshToken: string }
      ) => {
        if (err) {
          res.send(err.message)
          return
        }
        console.log('# Redirect path router activated')

        const { accessToken, refreshToken } = payload

        console.log(`accessToken: ${accessToken}`)
        console.log(`refreshToken: ${refreshToken}`)

        res.setHeader('Authorization', JSON.stringify(payload))

        res.redirect(
          queryString.stringifyUrl({
            url: redirectServiceURL,
            query: {
              accessToken,
              refreshToken,
            },
          })
        )

        res.end()
      }
    )(req, res, next)
  })

  return googleAuthRouter
}

const sayingGoogleAuthRouter = makeGoogleAuthRouter({
  serviceName: 'saying.today',
  redirectServiceURL: isDev ? 'http://localhost:3000' : 'https://saying.today',
})

const whereLandGoogleAuthRouter = makeGoogleAuthRouter({
  serviceName: 'where.land',
  redirectServiceURL: isDev ? 'http://localhost:3000' : 'https://where.land',
})

const googleAuthRouter = express.Router()

googleAuthRouter.use(sayingGoogleAuthRouter)
googleAuthRouter.use(whereLandGoogleAuthRouter)

export { googleAuthRouter }
