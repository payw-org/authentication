export function safelyParseJSON(
  value: string | undefined
): string | object | undefined
export function safelyParseJSON(value: number | undefined): number | undefined
export function safelyParseJSON(value: undefined): undefined
export function safelyParseJSON(value: null): null
export function safelyParseJSON(
  value: string | number | undefined | null
): string | number | object | undefined | null {
  if (!value) return value

  const valueType = typeof value

  if (valueType === 'string' || valueType === 'number') {
    try {
      return JSON.parse(value.toString())
    } catch {
      return value
    }
  }
}
