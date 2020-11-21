import { gsap, Power3 } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import queryString from 'query-string'

gsap.registerPlugin(ScrollTrigger)

const tl = gsap.timeline()

tl.fromTo(
  '.logo',
  {
    opacity: 0,
    yPercent: 150,
    scale: 1.5,
  },
  {
    opacity: 1,
    yPercent: 0,
    scale: 1,
    ease: Power3.easeOut,
    duration: 1.2,
    delay: 0.3,
  }
)

tl.fromTo(
  '.hl-1',
  {
    opacity: 0,
    yPercent: 100,
  },
  {
    opacity: 1,
    yPercent: 0,
    ease: Power3.easeOut,
    duration: 1.2,
    delay: -0.9,
  }
)

tl.fromTo(
  '.hl-2',
  {
    opacity: 0,
    yPercent: 70,
  },
  {
    opacity: 1,
    yPercent: 0,
    ease: Power3.easeOut,
    duration: 1.2,
    delay: -0.98,
  }
)

tl.to('.connected-service', {
  opacity: 1,
  duration: 1,
  delay: -0.7,
})

tl.to('.google', {
  opacity: 1,
  duration: 1,
  delay: -0.8,
})

const availableServices = ['saying.today', 'where.land']

function verifyService(serviceName: string) {
  return availableServices.includes(serviceName)
}

const query = queryString.parseUrl(window.location.href).query as {
  service?: string
}

const available = verifyService(query.service)

const connectedServiceElm = document.querySelector('.connected-service')
const googleBtn = document.querySelector<HTMLAnchorElement>('.google')

if (!available) {
  connectedServiceElm.innerHTML = `각 서비스에서 로그인을 요청하세요.`
  googleBtn.remove()
} else {
  connectedServiceElm.innerHTML = `서비스: ${query.service}`

  const dev = process.env.NODE_ENV === 'development'

  const host = dev ? 'http://localhost:3020' : ''

  googleBtn.href = `${host}/google/sign-up/${query.service}`
}
