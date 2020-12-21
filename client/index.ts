import axios, { AxiosError } from 'axios'
import Cookies from 'cookies'
import { IncomingMessage, ServerResponse } from 'http'

const availableServices = ['saying.today'] as const
type AvailableService = typeof availableServices[number]

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

function getLoginURL(service: AvailableService) {
  return `${paywAuthHost}/?service=${service}`
}

export const cookieNames = {
  accessToken: 'PAYW_access',
  refreshToken: 'PAYW_refresh',
}

const createHeaderAuth = (token: string) => `Bearer ${token}`

const cookiesSetOption: Cookies.SetOption = {
  path: '/',
  httpOnly: true,
  expires: new Date('2038-01-10'),
}

const PAYWAuth = (req: IncomingMessage, res: ServerResponse) => {
  const cookies = new Cookies(req, res)
  let accessToken = cookies.get(cookieNames.accessToken)
  const refreshToken = cookies.get(cookieNames.refreshToken)

  /**
   * Store tokens in httpOnly cookie
   */
  const storeTokens = async ({
    accessToken,
    refreshToken,
  }: {
    accessToken?: string
    refreshToken?: string
  }): Promise<void> => {
    if (accessToken) {
      cookies.set(cookieNames.accessToken, accessToken, cookiesSetOption)
    }

    if (refreshToken) {
      cookies.set(cookieNames.refreshToken, refreshToken, cookiesSetOption)
    }
  }

  /**
   * @deprecated Use `storeTokens` instead.
   */
  const setTokens = storeTokens

  /**
   * Verify the tokens
   */
  const verify = async (
    prod = false,
    loopCount = 0
  ): Promise<AuthData | false> => {
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

  /**
   * Redirect to the location
   */
  const redirect = (location: string): void => {
    res.writeHead(302, { Location: location }).end()
  }

  type PAYWAuthInstance = {
    storeTokens: typeof storeTokens
    setTokens: typeof storeTokens
    verify: typeof verify
    redirect: typeof redirect
  }

  return { storeTokens, setTokens, verify, redirect } as PAYWAuthInstance
}

export { getLoginURL, PAYWAuth }
