# Token & Security Model — Source of Truth

## Token types
- Authorization: Bearer <token> (user)
- X-Guest-Id (favorites)
- X-Cart-Token (cart, checkout)
- X-Comparison-Token (comparison)

## Storage rules
- Bearer token: cookies + Pinia, never localStorage.
- Guest tokens: localStorage (CSR) + cookiesookies (SSR fallback).

## SSR safety
- Never expose Bearer token on SSR.
- Never run cart or checkout logic on server.

## Store dependencies
- cart, checkout → X-Cart-Token (CSR only)
- favorites → X-Guest-Id (CSR only)
- comparison → X-Comparison-Token (CSR only)
- auth, orders → Bearer token
