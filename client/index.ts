import axios, { AxiosError } from 'axios'
import Cookies from 'cookies'
import { IncomingMessage, ServerResponse } from 'http'

type AuthData = {
  userID: number
}

type DecodedAuthData = AuthData & {
  iat: number
  exp: number
}

const devHost = 'http://localhost:3020'
const paywAuthHost = 'https://auth.payw.org'
const defaultHost =
  process.env.NODE_ENV === 'development' ? devHost : paywAuthHost

const cookieNames = {
  accessToken: 'PAYW_access',
  refreshToken: 'PAYW_refresh',
}

const createHeaderAuth = (token: string) => `Bearer ${token}`

const cookiesSetOption: Cookies.SetOption = {
  path: '/',
  httpOnly: true,
  expires: new Date('2038-01-10'),
}

export function PAYWAuth(req: IncomingMessage, res: ServerResponse) {
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
      cookies.set(cookieNames.accessToken, accessToken, cookiesSetOption)
    }

    if (refreshToken) {
      cookies.set(cookieNames.refreshToken, refreshToken, cookiesSetOption)
    }
  }

  async function verify(
    prod = false,
    loopCount = 0
  ): Promise<DecodedAuthData | false> {
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

            cookies.set(cookieNames.accessToken, accessToken, cookiesSetOption)

            loopCount += 1

            if (loopCount >= 10) {
              throw Error('PAYW Auth - Failed to verify')
            }

            return await verify(prod, loopCount)
          }
        } catch {
          return false
        }
      }
    }

    return false
  }

  function redirect(location: string) {
    res.writeHead(302, { Location: location }).end()
  }

  return { setTokens, verify, redirect }
}
