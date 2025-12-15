# SEO, Locale & Currency Rules — Source of Truth

## SEO source
GET /site?url=<path>

## SSR SEO pages
- home
- catalog
- product
- blog

## Non-indexable
- checkout, profile, auth → noindex, nofollow

## Locale
- Accept-Language required
- Locale change → SEO + content reload

## Currency
- Accept-Currency required
- Currency change → price reload + checkout refresh

## Forbidden
- Manual meta tags
- Manual price formatting
