import axios, { AxiosError } from 'axios'
import Cookies from 'cookies'
import { addMinutes } from 'date-fns'
import { IncomingMessage, ServerResponse } from 'http'

const devHost = 'http://localhost:3020'
const paywAuthHost = 'https://auth.payw.org'
const defaultHost =
  process.env.NODE_ENV === 'development' ? devHost : paywAuthHost

const cookieNames = {
  accessToken: 'PAYW_access',
  refreshToken: 'PAYW_refresh',
}

const createHeaderAuth = (token: string) => `Bearer ${token}`

export function PAYWAuth(req: IncomingMessage, res: ServerResponse) {
  let loop = 0
  const cookies = new Cookies(req, res)
  let accessToken = cookies.get(cookieNames.accessToken)
  const refreshToken = cookies.get(cookieNames.refreshToken)

  async function setTokens({
    accessToken,
    refreshToken,
  }: {
    accessToken?: string
    refreshToken?: string
  }) {
    if (accessToken) {
      cookies.set(cookieNames.accessToken, accessToken, {
        path: '/',
        httpOnly: true,
        expires: addMinutes(new Date(), 10),
      })
    }

    if (refreshToken) {
      cookies.set(cookieNames.refreshToken, refreshToken, {
        path: '/',
        httpOnly: true,
        expires: new Date('2999-12-31'),
      })
    }
  }

  async function verify(prod = false): Promise<boolean> {
    if (!accessToken) {
      return false
    }

    const host = prod ? paywAuthHost : defaultHost

    try {
      const res = await axios(`${host}/verify`, {
        method: 'POST',
        headers: {
          Authorization: createHeaderAuth(accessToken),
        },
      })

      return res.data
    } catch (e) {
      const error = e as AxiosError

      const data = error.response?.data

      if (data?.expired) {
        if (!refreshToken) {
          return false
        }

        try {
          const res = await axios(`${host}/refresh`, {
            method: 'POST',
            headers: {
              Authorization: createHeaderAuth(refreshToken),
            },
          })

          if (res.data?.accessToken) {
            accessToken = res.data.accessToken as string
            cookies.set(cookieNames.accessToken, accessToken)

            loop += 1

            if (loop >= 10) {
              throw Error('PAYW Auth - Failed to verify')
            }

            return await verify()
          }
        } catch {
          return false
        }
      }
    }

    return false
  }

  return { setTokens, verify }
}
