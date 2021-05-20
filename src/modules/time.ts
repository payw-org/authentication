import dayjs from 'dayjs'

export const dbNow = (): Date => dayjs().add(9, 'hour').toDate()

export const isPrimitive = (test: any) => test !== Object(test)

function subtract9Hours(obj: Record<string, unknown>) {
  if (!obj) return

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (val instanceof Date) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = dayjs(val).subtract(9, 'hour').toDate()
    } else if (!isPrimitive(val)) {
      subtract9Hours(val as any)
    }
  }
}

// Subtract 9 hours from all the Date objects
export function prismaTimeMod<T>(value: T): T {
  if (value instanceof Date) {
    return dayjs(value).subtract(9, 'hour').toDate() as any
  }

  if (isPrimitive(value)) {
    return value
  }

  subtract9Hours(value as any)

  return value
}
