import axios, { AxiosError } from 'axios'
import Cookies from 'cookies'
import { IncomingMessage, ServerResponse } from 'http'

const host = 'https://auth.payw.org'

export const cookieNames = {
  accessToken: 'PAYW_access',
  refreshToken: 'PAYW_refresh',
}

export function PAYWAuth(req: IncomingMessage, res: ServerResponse) {
  const cookies = new Cookies(req, res)
  const accessToken = cookies.get(cookieNames.accessToken)

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

  return { verifyAccess }
}
