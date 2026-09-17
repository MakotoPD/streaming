const CATEGORY_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other']

export function fillTemplate(template: string, values: Record<string, string | number | undefined>, locale: string): string {
  const rules = new Intl.PluralRules(locale)
  const categories = rules.resolvedOptions().pluralCategories
    .slice()
    .sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))

  return template.replace(/\{(\w+)(\|[^}]*)?\}/g, (whole, key: string, forms?: string) => {
    const value = values[key]
    if (value === undefined) return forms ? '' : whole
    if (!forms) return String(value)
    const list = forms.slice(1).split('|')
    const index = categories.indexOf(rules.select(Number(value)))
    return list[Math.min(Math.max(index, 0), list.length - 1)] ?? ''
  })
}
