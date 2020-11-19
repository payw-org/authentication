import { AuthData } from '@/modules/auth'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production'
      HOST: 'local' | 'remote'
    }
  }
}

declare module 'express' {
  export interface Response {
    locals: {
      token?: string
      authData?: AuthData
    }
  }
}
