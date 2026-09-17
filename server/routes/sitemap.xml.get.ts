export default defineEventHandler((event) => {
  const base = siteUrl()
  const today = new Date().toISOString().slice(0, 10)
  const urls = PUBLIC_PAGES.map(path => [
    '  <url>',
    `    <loc>${base}${path === '/' ? '' : path}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <priority>${path === '/' ? '1.0' : '0.5'}</priority>`,
    '  </url>'
  ].join('\n'))

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n')
})
