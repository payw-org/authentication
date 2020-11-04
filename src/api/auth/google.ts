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

function makeGoogleAuthRouter({ appName }: { appName: string }) {
  const redirectURL = `${host}/google/redirect/${appName}`

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

        console.log(profile)

        if (!profile.emails) {
          done(Error(`Email doesn't exist`))
          return
        }

        const existingUser = await prisma.user.findOne({
          where: {
            userID: profile.emails[0].value,
          },
        })

        if (existingUser) {
          done(null, {
            userID: existingUser.id,
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

        done(null, authData)
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

  googleAuthRouter.get(redirectURL, (req, res, next) => {
    passport.authenticate(
      `google-${appName}`,
      {
        session: false,
      },
      async (err, authData: AuthData) => {
        console.log(authData)

        const accessToken = signAccessToken(authData)
        const refreshToken = await signRefreshToken(authData)

        res.cookie('accessToken', accessToken, {
          path: '/',
          httpOnly: true,
        })
        res.cookie('refreshToken', refreshToken, {
          path: '/',
          httpOnly: true,
        })
        res.redirect('/')
      }
    )(req, res, next)
  })

  return googleAuthRouter
}

const sayingGoogleAuthRouter = makeGoogleAuthRouter({
  appName: 'saying',
})

const whereLandGoogleAuthRouter = makeGoogleAuthRouter({
  appName: 'whereland',
})

const googleAuthRouter = express.Router()

googleAuthRouter.use(sayingGoogleAuthRouter)
googleAuthRouter.use(whereLandGoogleAuthRouter)

export { googleAuthRouter }
