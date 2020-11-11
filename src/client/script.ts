import { gsap, Power3 } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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

tl.to('.google', {
  opacity: 1,
  duration: 1,
  delay: -0.7,
})

console.log(window.location.search)
