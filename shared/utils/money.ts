export function formatMoney(amount: number, currency: string | undefined, locale: string) {
  const digits = Number.isInteger(amount) ? 0 : 2
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'PLN', minimumFractionDigits: digits, maximumFractionDigits: 2 }).format(amount)
  }
  catch {
    return `${amount.toFixed(digits)} ${currency ?? ''}`.trim()
  }
}
