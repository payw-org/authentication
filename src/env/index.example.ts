export const env = {
  port: {
    dev: 0,
    prod: 0,
  },
  auth: {
    jwt: {
      accessTokenSecret: '',
      refreshTokenSecret: '',
      accessTokenLifetime: '',
    },
    google: {
      clientID: '',
      clientSecret: '',
    },
  },
}
