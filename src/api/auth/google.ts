import { env } from '@/env'
import { signAccessToken, signRefreshToken } from '@/modules/auth'
import { prisma } from '@/modules/prisma'
import { AuthData } from '@/types'
import { currentTime } from '@/utils/time'
import express from 'express'
import passport from 'passport'
import * as GoogleStrategy from 'passport-google-oauth'

const host =
  process.env.HOST === 'local'
    ? `http://localhost:${
        process.env.NODE_ENV === 'development' ? env.port.dev : env.port.prod
      }`
    : `https://auth.payw.org`

function makeGoogleAuthRouter({
  appName,
  redirectServiceURL,
}: {
  appName: string
  redirectServiceURL: string
}) {
  const redirectPath = `/google/redirect/${appName}`
  const redirectURL = `${host}${redirectPath}`

  passport.use(
    `google-${appName}`,
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

        const existingUser = await prisma.user.findOne({
          where: {
            userID: profile.emails[0].value,
          },
        })

        if (existingUser) {
          done(null, {
            refreshToken: existingUser.refreshToken,
            accessToken: signAccessToken({ userID: existingUser.id }),
          })
          return
        }

        const createdUser = await prisma.user.create({
          data: {
            userID: profile.emails[0].value,
            registeredAt: currentTime(),
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

        const payload = {
          refreshToken,
          accessToken: signAccessToken(authData),
        }

        done(null, payload)
      }
    )
  )

  const googleAuthRouter = express.Router()

  googleAuthRouter.get(
    `/google/sign-up/${appName}`,
    passport.authenticate(`google-${appName}`, {
      scope: ['profile', 'email'],
      session: false,
    })
  )

  googleAuthRouter.get(redirectPath, (req, res, next) => {
    passport.authenticate(
      `google-${appName}`,
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

        console.log(`accessToken: ${payload.accessToken}`)
        console.log(`refreshToken: ${payload.refreshToken}`)

        res.redirect(
          queryString.stringifyUrl({
            url: redirectServiceURL,
            query: { accessToken, refreshToken },
          })
        )

        res.end()
      }
    )(req, res, next)
  })

  return googleAuthRouter
}

const sayingGoogleAuthRouter = makeGoogleAuthRouter({
  appName: 'saying',
  redirectServiceURL: 'https://saying.today',
})

const whereLandGoogleAuthRouter = makeGoogleAuthRouter({
  appName: 'whereland',
  redirectServiceURL: 'https://where.land',
})

const googleAuthRouter = express.Router()

googleAuthRouter.use(sayingGoogleAuthRouter)
googleAuthRouter.use(whereLandGoogleAuthRouter)

export { googleAuthRouter }
