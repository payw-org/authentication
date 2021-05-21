import axios, { AxiosError } from 'axios'
import Cookies from 'cookies'
import { IncomingMessage, ServerResponse } from 'http'

const availableServices = ['saying.today'] as const
type AvailableService = typeof availableServices[number]

type AuthData = {
  userID: number
}

const devHost = 'http://localhost:3020'
const paywAuthHost = 'https://auth.payw.org'

function whichHost(dev = false) {
  return dev ? devHost : paywAuthHost
}

function getLoginURL(service: AvailableService, dev = false) {
  const host = whichHost(dev)
  return `${host}/?service=${service}`
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

const refreshSetOption: Cookies.SetOption = {
  httpOnly: true,
  expires: new Date('2038-01-10'),
}

const clearOption: Cookies.SetOption = {
  expires: new Date('1997-01-01'),
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
      cookies.set(cookieNames.refreshToken, refreshToken, {
        ...refreshSetOption,
        path: '/payw-auth/refresh',
      })
      cookies.set(cookieNames.refreshToken, refreshToken, {
        ...refreshSetOption,
        path: '/payw-auth/revoke',
      })
    }
  }

  /**
   * @deprecated Use `storeTokens` instead.
   */
  const setTokens = storeTokens

  const clearTokens = () => {
    cookies.set(cookieNames.accessToken, '', {
      ...clearOption,
      path: '/',
    })
    cookies.set(cookieNames.refreshToken, '', {
      ...clearOption,
      path: '/payw-auth/refresh',
    })
    cookies.set(cookieNames.refreshToken, '', {
      ...clearOption,
      path: '/payw-auth/revoke',
    })
  }

  /**
   * Verify the tokens
   */
  const verify = async (options?: {
    dev?: boolean
    loopCount?: number
  }): Promise<AuthData | false> => {
    const dev = options?.dev ?? false
    let loopCount = options?.loopCount ?? 0

    console.log(`accessToken: ${accessToken}`)

    if (!accessToken) {
      return false
    }

    const host = whichHost(dev)

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
        console.log(`refreshToken: ${refreshToken}`)

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

            return await verify({
              dev,
              loopCount,
            })
          }
        } catch {
          clearTokens()

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
    /**
     * @deprecated Use `storeTokens` instead.
     */
    setTokens: typeof storeTokens
    clearTokens: typeof clearTokens
    verify: typeof verify
    redirect: typeof redirect
  }

  const paywAuthInstance: PAYWAuthInstance = {
    storeTokens,
    setTokens,
    clearTokens,
    verify,
    redirect,
  }

  return paywAuthInstance
}

export { getLoginURL, PAYWAuth }
