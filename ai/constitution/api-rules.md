# API Contract Rules — Source of Truth

## Allowed endpoints
- Use ONLY endpoints defined in api.md.
- Never invent endpoints or parameters.

## API access
- All requests go through useApi().
- Direct fetch() in components is forbidden.

## Headers (automatic)
Accept-Language
Accept-Currency
Authorization (if logged in)
X-Guest-Id
X-Cart-Token
X-Comparison-Token

## SSR / CSR rules
- SSR: catalog, product, blog only.
- CSR: cart, checkout, favorites, comparison, profile.

## Errors
- 401 → logout
- 422 → validation handling
- Never swallow errors.
