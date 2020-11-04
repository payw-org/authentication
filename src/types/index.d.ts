export type AuthData = {
  userID: number
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production'
      HOST: 'local' | 'remote'
    }
  }
}
