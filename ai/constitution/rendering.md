# Rendering Model (SSR / CSR) — Source of Truth

## SSR pages
- /
- /catalog/*
- /product/*
- /blog/*

Rules:
- useAsyncData
- public data only
- SEO fetched on SSR

## CSR-only pages
- /cart
- /checkout
- /favorites
- /comparison
- /profile/*
- /auth/*

Rules:
- No SSR fetch
- Client-only logic

## Forbidden
- SSR cart or checkout
- Browser APIs on server
