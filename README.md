<p align="center">
  <img src="https://user-images.githubusercontent.com/19797697/102344629-8960a000-3fdf-11eb-8be6-54032343a6d5.png" width="300" />
</p>

<p align="center"><b>PAYW Authentication</b> centralizes and simplifies<br />the sign up/login process of every PAYW service.</p>

---

### JWT

PAYW Auth uses [JSON Web Tokens](https://jwt.io/) to authenticate user identity.

### Supported OAuth

- Google

### Available Services

- [saying.today](https://saying.today)

---

# Auth API

- [Sign Up / Login](#Sign-Up--Login)
- [Verify Access Token](#Verify-Access-Token)
- [Refresh Access Token](#Refresh-Access-Token)
- [Revoke Refresh Token](#Revoke-Refresh-Token)

## Sign Up / Login

### Google

<pre>
https://auth.payw.org/google/sign-up/<b>:serviceName</b>
</pre>

## Verify Access Token

<pre>
https://auth.payw.org/verify
</pre>

### Headers

| Field           | Value                  |
| --------------- | ---------------------- |
| `Authorization` | `Bearer {accessToken}` |

### Response

**200**

```ts
{
  userID: number,
  iat: number,
  exp: number
}
```

**401 (Unauthorized)**

```ts
null

// or

{
  expired: true
}
```

## Refresh Access Token

<pre>
https://auth.payw.org/refresh
</pre>

### Headers

|      Field      |          Value          |
| :-------------: | :---------------------: |
| `Authorization` | `Bearer {refreshToken}` |

### Response

**200**

```ts
{
  accessToken: string
}
```

**401 (Unauthorized)**

```ts
null
```

## Revoke Refresh Token

Remove the previous refresh token and re-sign the new refresh token.

<pre>
https://auth.payw.org/revoke
</pre>

### Headers

|      Field      |          Value          |
| :-------------: | :---------------------: |
| `Authorization` | `Bearer {refreshToken}` |

### Response

**200**

```ts
{
  refreshToken: string
}
```

**401 (Unauthorized)**

```ts
null
```

# PAYW Auth Client

It is a module which includes several helper methods and most importantly automates the authentication process by following the flow below.

- Verify the access token.
  - If unauthorized, return `false`.
  - If authorized, return the 200 response of [Verify Access Token](#Verify-Access-Token).
  - If the access token has expired, try to refresh the access token using the refresh token.
    - If unauthorized, return `false`.
    - If authorized, override the access token in cookie then go back to the first stage and verify again with the new token.

> If you don't use the PAYW Auth Client, you have to manually implement this flow by yourself.

### Installation

**Node.js**

```zsh
npm install @payw/auth
```

```ts
import { PAYWAuth } from '@payw/auth'

const paywAuth = PAYWAuth(req, res)

paywAuth.verify().then((result) => {
  // Do something
})
```

## PAYW Auth Client API

### `PAYWAuth(req: IncomingMessage, res: ServerResponse)`

### `PAYWAuthInstance.setTokens({ accessToken?: string, refreshToken?: string })`

### `PAYWAuthInstance.verify()`

### `PAYWAuthInstance.redirect(location: string)`
