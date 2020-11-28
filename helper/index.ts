import axios, { AxiosError } from 'axios'
import Cookies from 'cookies'
import { addMinutes } from 'date-fns'
import { IncomingMessage, ServerResponse } from 'http'

const host = 'https://auth.payw.org'

const cookieNames = {
  accessToken: 'PAYW_access',
  refreshToken: 'PAYW_refresh',
}

export function PAYWAuth(req: IncomingMessage, res: ServerResponse) {
  const cookies = new Cookies(req, res)
  const accessToken = cookies.get(cookieNames.accessToken)

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

  async function verifyAccess() {
    if (!accessToken) {
      return false
    }

    try {
      const res = await axios(`${host}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return res.data
    } catch (e) {
      const error = e as AxiosError

      if (error.response?.status === 401) {
        return error.response.data
      }
    }
  }

  return { setTokens, verifyAccess }
}
