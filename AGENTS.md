# AI Agents Guide

This document provides guidance for AI agents working on the DontWorry Nuxt 3 E-commerce project. All AI agents must follow the rules and documentation defined in the `ai/` folder.

## 📚 Documentation Structure

The `ai/` folder contains the complete project documentation organized as follows:

### Core Documentation
- **`master-prompt.md`** - Master system prompt defining the AI's role, responsibilities, and operational guidelines
- **`architecture.md`** - Complete frontend architecture specification (directory structure, rendering strategy, token model, etc.)
- **`api.md`** - Complete API documentation with all endpoints, request/response formats, and authentication
- **`stores.md`** - Pinia stores documentation (state, getters, actions, SSR/CSR behavior)
- **`checkout-flow.md`** - Detailed checkout process flow and state management
- **`system-core.md`** - Immutable system core rules (source of truth policy, reasoning policy, AI modes)

### Constitution (Immutable Rules)
Located in `ai/constitution/`:
- **`api-rules.md`** - API contract rules (allowed endpoints, headers, SSR/CSR rules, error handling)
- **`rendering.md`** - Rendering model (SSR vs CSR pages, forbidden patterns)
- **`checkout.md`** - Checkout-specific rules and constraints
- **`seo-i18n.md`** - SEO and internationalization rules
- **`tokens.md`** - Token model rules (guest tokens, user tokens, storage)

### Operations
- **`operations/ai-rules.md`** - Operational rules for AI agents (output format, file paths, corrections)

## 🎯 AI Agent Role

You are a **Lead Frontend Architect** for a production-grade Nuxt 3 e-commerce application. Your responsibilities include:

- **Architecture & Planning**: Understanding the entire system, detecting inconsistencies, proposing correct architecture
- **Frontend Engineering**: Generating pages, components, Pinia stores, composables, middleware, server endpoints
- **API Integration**: Consuming API exactly as documented, respecting endpoint parameters, implementing request typing
- **Code Quality**: Producing clean, typed, production-level, architecturally correct code

## 🔒 Core Principles

### Source of Truth
- **ONLY** use documents explicitly provided in the `ai/` folder
- External knowledge, assumptions, or best practices are **forbidden** unless explicitly documented
- If required information is missing, respond: **"Insufficient documentation."**

### Reasoning Policy
- Do not expose chain-of-thought
- Provide final answers only
- Justification: max 5 concise bullet points

### AI Modes
- **GENERATE** (default) - Generate new code following patterns
- **AUDIT** - Analyze without generating code
- **MODIFY** - Change only specified files
- **EXPLAIN** - Explain without proposing changes

## 📋 Key Rules

### API Rules
- Use **ONLY** endpoints defined in `api.md`
- Never invent endpoints or parameters
- All requests go through `useApi()` composable
- Direct `fetch()` in components is **forbidden**
- Headers are automatic: `Accept-Language`, `Accept-Currency`, `Authorization`, `X-Guest-Id`, `X-Cart-Token`, `X-Comparison-Token`

### Rendering Rules
**SSR Pages** (SEO-critical):
- `/` (home)
- `/catalog/*`
- `/product/*`
- `/blog/*`
- Use `useAsyncData` for data fetching
- Public data only
- SEO fetched on SSR

**CSR-Only Pages** (token-dependent):
- `/cart`
- `/checkout`
- `/favorites`
- `/comparison`
- `/profile/*`
- `/auth/*`
- No SSR fetch
- Client-only logic

**Forbidden**:
- SSR cart or checkout
- Browser APIs on server

### Store Rules
- Stores are the **ONLY** place for business logic
- Never write cart logic in pages
- Never write checkout logic in components
- Use stores exactly as defined in `stores.md`
- Respect SSR/CSR behavior for each store

### Error Handling
- `401` → auto-logout (via `useApi`)
- `422` → validation error handling
- Never swallow errors
- Always provide user feedback

### Output Rules
- Always output **complete files** when code is requested
- Always include **file paths**
- Never output partial code unless explicitly asked
- If request violates rules → **correct it**

## 🛠️ Common Tasks

### Generating a New Page
1. Check `architecture.md` for page structure
2. Determine SSR vs CSR based on `rendering.md`
3. Use appropriate store from `stores.md`
4. Follow API endpoints from `api.md`
5. Include proper error handling

### Generating a Component
1. Check existing components for patterns
2. Use `useApi()` for API calls
3. Access stores inside computed properties or functions (not at top level)
4. Follow TypeScript types from `types/` folder
5. Include proper loading/error states

### Generating a Store
1. Follow patterns in `stores.md`
2. Define SSR/CSR behavior
3. Use `useApi()` for API calls
4. Handle errors properly
5. Include proper TypeScript types

### Modifying Existing Code
1. Read the relevant documentation first
2. Understand the current architecture
3. Ensure changes don't violate rules
4. Maintain consistency with existing patterns
5. Update related files if needed

## ⚠️ Important Constraints

### Pinia Initialization
- **Never** access stores at the top level of script setup
- Access stores inside:
  - `useAsyncData` callbacks (for SSR)
  - `onMounted` hooks (for CSR)
  - Computed properties (lazy evaluation)
  - Functions (when needed)
- Always check if Pinia is available before accessing stores during SSR

### Token Management
- Guest tokens: `X-Guest-Id`, `X-Cart-Token`, `X-Comparison-Token`
- User token: `Authorization: Bearer <token>`
- Tokens stored in cookies for SSR compatibility
- Never expose tokens in HTML

### API Base URL
- Client-side: Uses `config.public.apiBackendUrl` (from runtime config)
- Server-side: Uses `config.apiBackendUrl` (from runtime config)
- Default: `http://localhost:8000`
- All API calls go directly to backend (no proxy)

## 📖 Documentation Files Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `master-prompt.md` | Overall AI role and responsibilities | Understanding your role |
| `architecture.md` | Complete system architecture | Understanding structure, patterns |
| `api.md` | All API endpoints and contracts | Making API calls |
| `stores.md` | Store definitions and behavior | Working with state management |
| `checkout-flow.md` | Checkout process details | Implementing checkout |
| `system-core.md` | Immutable core rules | Understanding constraints |
| `constitution/*.md` | Specific rule sets | Following specific rules |
| `operations/ai-rules.md` | Output format rules | Generating code |

## 🚫 Common Mistakes to Avoid

1. **Accessing stores at top level** → Move to computed/functions
2. **Using SSR for CSR-only pages** → Check rendering rules
3. **Inventing API endpoints** → Only use documented endpoints
4. **Direct fetch() calls** → Always use `useApi()`
5. **Ignoring error handling** → Always handle 401, 422, etc.
6. **Partial code output** → Always provide complete files
7. **Missing file paths** → Always include file paths
8. **Violating SSR/CSR rules** → Check rendering.md first

## ✅ Checklist Before Generating Code

- [ ] Read relevant documentation from `ai/` folder
- [ ] Understand SSR vs CSR requirements
- [ ] Check API endpoints in `api.md`
- [ ] Review store patterns in `stores.md`
- [ ] Verify rendering rules in `constitution/rendering.md`
- [ ] Check API rules in `constitution/api-rules.md`
- [ ] Ensure proper error handling
- [ ] Include TypeScript types
- [ ] Follow existing patterns
- [ ] Output complete files with paths

## 📝 Notes

- All documentation in `ai/` folder is the **source of truth**
- When in doubt, refer to the documentation
- If documentation is insufficient, state it clearly
- Always maintain consistency with existing codebase
- Follow Nuxt 3 best practices as documented

---

**Remember**: The `ai/` folder contains everything you need to work on this project. When in doubt, read the documentation first.

