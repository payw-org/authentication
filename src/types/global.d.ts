import 'express-serve-static-core'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production'
      HOST: 'local' | 'remote'
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    token: string
  }
}
