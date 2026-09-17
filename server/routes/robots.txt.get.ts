export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /o/',
    'Disallow: /c/',
    'Disallow: /dashboard',
    'Disallow: /sounds/',
    '',
    `Sitemap: ${siteUrl()}/sitemap.xml`,
    ''
  ].join('\n')
})
