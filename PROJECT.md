# VapeHub Admin — Project Documentation

> **Branch:** `staging`  
> **Package:** `fuse-react-app` v14.0.0  
> **SonarQube project:** VapeHub Admin  
> **Last documented from:** `origin/staging` (up to date)

This document describes the **VapeHub Admin** control panel: a Next.js admin application used to manage the VapeHub e-commerce platform (catalog, orders, content, marketing, newsletter, SEO, and more).

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Repository Structure](#4-repository-structure)
5. [Application Modules](#5-application-modules)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API & Services Layer](#7-api--services-layer)
8. [State Management](#8-state-management)
9. [UI, Layout & Shared Components](#9-ui-layout--shared-components)
10. [Rich Text & Email Builder](#10-rich-text--email-builder)
11. [Environment Variables](#11-environment-variables)
12. [Scripts & Local Development](#12-scripts--local-development)
13. [CI/CD & Quality](#13-cicd--quality)
14. [Routing Map](#14-routing-map)
15. [Notable Feature Areas](#15-notable-feature-areas)
16. [Conventions & Notes](#16-conventions--notes)

---

## 1. Overview

**VapeHub Admin** is a private admin console built on the **Fuse React (Next.js)** theme/skeleton. It talks to a backend admin API (`NEXT_PUBLIC_BASE_URL`) for all business data.

### Primary responsibilities

| Domain | Capabilities |
|--------|----------------|
| Catalog | Products, brands, categories, variants, attributes/terms, inventory |
| Commerce | Orders (incl. bulk status jobs), transactions, coupons, deals, shipping |
| Customers & users | Admin users, customers, loyalty points, referral methods |
| Content / CMS | Banners, carousels, flash news, footer, menu, FAQ, welcome, feature content, popular/shop-by categories |
| Blog | Posts, categories, tags, authors (CKEditor-based) |
| Marketing | Newsletter subscribers/settings/templates/campaigns, abandoned carts, email builder (Stripo) |
| Growth / SEO | SEO entities, Google Analytics realtime overview |
| Settings | General settings, contact us, reviews, trust strip |

### Runtime identity

- **Deployed app name (PM2):** `Admin`
- **Staging deploy path:** `/var/www/vapehub/admin/`
- **Default production start port:** `3024` (`npm start`)

---

## 2. Tech Stack

### Core

| Layer | Technology | Version (approx.) |
|-------|------------|-------------------|
| Framework | Next.js (App Router) | 15.5.25 |
| UI library | React | 19.0.0 |
| Language | TypeScript | 5.4.5 |
| Styling | MUI + Emotion + Tailwind CSS | MUI 6.x / Tailwind 4 |
| Theme base | Fuse React | 14.0.0 |
| Auth | NextAuth (Auth.js) v5 beta + custom JWT cookie flow | 5.0.0-beta.25 |
| HTTP | Axios | ^1.7.9 |
| Data fetching patterns | Axios services + SWR (in places) | SWR ^2.3.2 |
| Forms | React Hook Form + Zod | RHF ^7 / Zod 3.23 |
| Tables | Material React Table | 3.0.1 |
| Charts | ApexCharts, Chart.js | — |
| Editor | CKEditor 5 (+ premium features) | ^47.2 |
| DnD | `@dnd-kit/*` | — |
| State | Redux Toolkit + React Redux | RTK 2.4 |
| Notifications | notistack | 3.0.1 |
| Dates | dayjs, date-fns, moment | — |
| Session storage (Auth.js) | Unstorage (memory / Upstash Redis) | — |

### Tooling

- **Node:** `>=22.12.0`
- **npm:** `>=10.9.0`
- **Lint:** ESLint 9 + Prettier plugins (`eslint.config.mjs`)
- **CI:** Jenkins (`Jenkinsfile`) + SonarQube (`sonar-project.properties`)

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Admin UI)                      │
│  Next.js App Router  ·  Fuse layouts  ·  MUI components     │
└───────────────────────────┬─────────────────────────────────┘
                            │
            Axios (Bearer token from cookie)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Admin API (external)                   │
│         NEXT_PUBLIC_BASE_URL + /api/admin/...               │
└─────────────────────────────────────────────────────────────┘
```

### High-level flow

1. Admin signs in via `/sign-in` (credentials against `/api/admin/auth/login`).
2. Auth token is stored (cookie/`auth_token`) and attached by Axios request interceptor.
3. Feature pages live under `src/app/(control-panel)/apps/...` and dashboards under `dashboards/`.
4. Domain logic and HTTP calls are centralized in `src/services/api*.ts`.
5. Shared UI (forms, tables, CKEditor wrappers, dialogs) lives in `src/components/Shared`.
6. Navigation is driven by `src/configs/navigationConfig.ts`.

### App Router route groups

| Group | Path | Purpose |
|-------|------|---------|
| `(control-panel)` | Authenticated admin shell | Apps + dashboards |
| `(public)` | Unauthenticated | Sign-in, sign-up, forgot/reset password, 401/404 |
| `api` | Next.js route handlers | NextAuth, Stripo helpers, mock auth |

### Build notes (`next.config.mjs`)

- `reactStrictMode: false`
- ESLint ignored during production builds
- TypeScript build errors ignored (`ignoreBuildErrors: true`)
- Webpack `raw-loader` support for `?raw` imports

---

## 4. Repository Structure

```
admin/
├── docs/                          # API / feature docs (e.g. bulk order status jobs)
├── public/                        # Static assets, stripo-builder.html, favicon
├── src/
│   ├── @auth/                    # NextAuth config, guards, auth forms, roles
│   ├── @fuse/                     # Fuse theme core (navigation, layouts, utils)
│   ├── @mock-utils/               # Mock helpers
│   ├── api/                       # (legacy / additional API helpers if present)
│   ├── app/
│   │   ├── (control-panel)/       # Main admin UI
│   │   │   ├── apps/              # Feature modules (35+)
│   │   │   ├── dashboards/        # Admin + project dashboards
│   │   │   └── layout.tsx
│   │   ├── (public)/              # Public auth & error pages
│   │   ├── api/                   # Next.js API routes
│   │   ├── auth/                  # Auth-related app routes
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Entry redirect
│   ├── components/                # Shared + theme-layout components
│   ├── configs/                   # Navigation, themes, settings
│   ├── contexts/                  # React contexts
│   ├── features/                  # Cross-cutting features (email-builder)
│   ├── hooks/                     # Shared hooks (debounce, page state, fetch)
│   ├── lib/                       # Libraries / helpers
│   ├── pages/                     # Pages Router leftovers (e.g. Google token)
│   ├── services/                  # Domain API clients (37 service files)
│   ├── store/                     # Redux store setup
│   ├── styles/                    # Global styles
│   ├── tabs/                      # Tab helpers
│   ├── types/                     # Shared TS types
│   └── utils/                     # Axios, auth cookies, helpers, node scripts
├── Jenkinsfile                    # Staging Sonar + deploy pipeline
├── package.json
├── PROJECT.md                     # This document
├── README.md                      # Upstream Fuse React version notes
├── sonar-project.properties
└── tsconfig.json
```

### Path aliases (`tsconfig.json`)

| Alias | Maps to |
|-------|---------|
| `@/*` | `./src/*` |
| `@auth/*` | `./src/@auth/*` |
| `@fuse/*` | `./src/@fuse/*` |
| `@mock-utils/*` | `./src/@mock-utils/*` |
| `@i18n` / `@i18n/*` | i18n module |
| `@schema` | schema module |

---

## 5. Application Modules

Navigation source of truth: `src/configs/navigationConfig.ts`.

### Dashboard

| Module | Route | Description |
|--------|-------|-------------|
| Admin Dashboard | `/dashboards/admin` | Sales stats, charts, recent orders/transactions |
| Project Dashboard | `/dashboards/project` | Fuse sample/project dashboard (legacy template) |

### Analytics

| Module | Route | Description |
|--------|-------|-------------|
| Realtime Overview | `/apps/analytics` | Google Analytics realtime overview (OAuth + property id) |
| Generate Leads | `/apps/analytics/generate-leads` | Lead analytics view |
| Realtime Pages | `/apps/analytics/realtime-pages` | Realtime pages breakdown |

### Catalog & inventory

| Module | Route | Description |
|--------|-------|-------------|
| Attributes | `/apps/attribute` | Product attributes CRUD |
| Attribute Terms | `/apps/attribute-terms` | Terms for attributes |
| Products | `/apps/product` | Product list, detail, update; flags like **coming soon** / **discontinued** |
| Product Brands | `/apps/product-brand` | Brands + brand buying guides |
| Product Categories | `/apps/product-category` | Categories + category buying guides |
| Product Variants | `/apps/product-variant` | Variant management / stock updates |
| Inventory | `/apps/inventory` | Inventory management |

### Blog

| Module | Route | Description |
|--------|-------|-------------|
| Posts | `/apps/blog/posts` | Create / edit / list posts (CKEditor) |
| Categories | `/apps/blog/categories` | Blog categories |
| Tags | `/apps/blog/tags` | Blog tags |
| Authors | `/apps/blog/author` | Blog authors |

### Users & customers

| Module | Route | Description |
|--------|-------|-------------|
| Users | `/apps/users` | Admin users (create/update/block/restore) |
| Customers | `/apps/customer` | Storefront customers + detail + export jobs |
| Profile | `/apps/profile` | Logged-in admin profile |

### Orders & payments

| Module | Route | Description |
|--------|-------|-------------|
| Order Report | `/apps/order/list` | Order list, filters, statistics, **bulk status update jobs** |
| Order Detail | `/apps/order/detail/[orderId]` | Order detail + status timeline |
| Transactions | `/apps/transaction/list` | Payment transactions |
| Transaction Detail | `/apps/transaction/detail/[transactionId]` | Single transaction |

### Marketing & promotions

| Module | Route | Description |
|--------|-------|-------------|
| Coupons | `/apps/coupon` | Coupon management |
| Deals | `/apps/deals` | Deal campaigns |
| Flash News | `/apps/flash-news` | Site flash news |
| Referral Methods | `/apps/referral-methods` | Referral method config |
| Loyalty Points | `/apps/loyalty-points` | Loyalty point rules |
| Reviews | `/apps/review` | Product/store reviews |
| Shipping Methods | `/apps/shipping-methods` | Shipping methods CRUD |

### Newsletter & abandoned carts

| Module | Route | Description |
|--------|-------|-------------|
| Subscribers | `/apps/newsletter/subscriber` | Newsletter subscribers |
| Settings | `/apps/newsletter/settings` | Mail subscription settings |
| Create Email Builder | `/apps/newsletter/create-email-builder` | Stripo-based email creation |
| Edit Email Builder | `/apps/newsletter/edit-email-builder/[id]` | Edit existing template |
| Templates | `/apps/newsletter/templates` | Saved newsletter templates |
| Default Templates | `/apps/newsletter/default-templates` | Default template catalog |
| Groups | `/apps/newsletter/groups` | Subscriber groups |
| Campaigns / Email History | `/apps/newsletter/campaigns` | Campaign history |
| Abandoned Carts | `/apps/newsletter/abandoned-carts` | Abandoned cart list + summary metrics |
| Abandoned Cart Detail | `/apps/newsletter/abandoned-carts/[orderId]` | Per-cart recovery detail |

### CMS / storefront content

| Module | Route | Description |
|--------|-------|-------------|
| Banner | `/apps/banner` | Banner CRUD |
| Carousel | `/apps/carousel` | Carousel CRUD |
| Footer | `/apps/footer` | Footer management |
| Menu | `/apps/menu` | Navigation menu builder |
| Contact Us | `/apps/contact-us` | Contact content |
| Welcome | `/apps/welcome` | Welcome content |
| Feature Content | `/apps/feature-content` | Feature content blocks |
| Popular Categories | `/apps/popular-categories` | Popular category curation |
| Shop By Categories | `/apps/shop-by-categories` | Shop-by-category curation |
| FAQ | `/apps/faq` | FAQ add/edit (accordion UI) |
| Trust Strip | `/apps/trust-strip` | Trust strip content |
| SEO | `/apps/seo` | SEO metadata management |
| Settings | `/apps/settings` | General settings |

---

## 6. Authentication & Authorization

### Dual auth surface

1. **Production admin login (primary):** credentials against backend  
   - `POST /api/admin/auth/login` via `src/services/apiService.ts`  
   - Token stored and read via `src/utils/auth.ts` (`auth_token`, `user_info` cookies)  
   - Axios attaches `Authorization: Bearer <token>`

2. **NextAuth / Auth.js (`src/@auth/authJs.ts`):** Fuse template providers (Credentials demo, Google, Facebook) with Unstorage adapter (memory locally, Upstash Redis on Vercel).

### Session expiry handling

On HTTP **401**, Axios response interceptor:

- Clears `auth_token` / `user_info` cookies
- Clears persisted page filter state (`clearAllPageState`)
- Redirects to `/sign-in`

### Roles (`src/@auth/authRoles.ts`)

| Role key | Allowed roles |
|----------|----------------|
| `admin` | `admin` |
| `staff` | `admin`, `staff` |
| `user` | `admin`, `staff`, `user` |
| `onlyGuest` | unauthenticated |

### Public auth pages

- `/sign-in`, `/sign-up`, `/sign-out`
- `/forgot-password`, `/reset-password`
- `/email-verify`
- `/401`, `/404`

---

## 7. API & Services Layer

### HTTP client

`src/utils/axiosApi.ts`

- `baseURL`: `process.env.NEXT_PUBLIC_BASE_URL`
- Timeout: 60s
- Auto Bearer token
- FormData uploads: Content-Type header removed so browser sets multipart boundary
- 401 → logout + redirect

### Generic helpers (`src/services/apiService.ts` and per-domain services)

Most services expose:

- `fetcher` → GET  
- `poster` → POST  
- `updater` → PUT  
- `patcher` → PATCH (where needed)  
- `deleter` → DELETE  

### Service files (`src/services/`)

| File | Domain |
|------|--------|
| `apiService.ts` | Auth, users, customers, roles |
| `apiProduct.ts` | Products (incl. coming soon / discontinued) |
| `apiProductBrand.ts` | Brands |
| `apiProductCategory.ts` | Categories |
| `apiProductVariant.ts` | Variants |
| `apiAttribute.ts` / `apiAttributeTerm.ts` | Attributes & terms |
| `apiInventory.ts` | Inventory |
| `apiOrder.ts` | Orders + bulk status jobs |
| `apiTransaction.ts` | Transactions |
| `apiCoupon.ts` | Coupons |
| `apiDeals.ts` | Deals |
| `apiShippingMethod.ts` | Shipping |
| `apiLoyaltyPoints.ts` | Loyalty |
| `apiReferralMethods.ts` | Referrals |
| `apiReview.ts` | Reviews |
| `apiBlog.ts` | Blog |
| `apiBanner.ts` / `apiCarousel.ts` | Banners / carousels |
| `apiFlashNews.ts` | Flash news |
| `apiFooter.ts` / `apiMenu.ts` | Footer / menu |
| `apiFaq.ts` | FAQ |
| `apiContactUs.ts` / `apiWelcome.ts` | Contact / welcome |
| `apiFeatureContent.ts` | Feature content |
| `apiPopularCategory.ts` / `apiShopByCategory.ts` | Category showcases |
| `apiSeo.ts` | SEO |
| `apiSetting.ts` | Settings |
| `apiDashboard.ts` | Dashboard stats |
| `apiSubscribers.ts` | Newsletter subscribers |
| `apiMailSubscriptionSettings.ts` | Newsletter settings |
| `apiNewsletterTemplates.ts` | Templates |
| `apiAbandonedCarts.ts` | Abandoned carts |
| `apiBrandBuyingGuide.ts` / `apiCategoryBuyingGuide.ts` | Buying guides |
| `apiService.ts` (store) | Related store API wiring |

Typical backend path prefix: `/api/admin/...`.

### Next.js API routes (`src/app/api/`)

| Route | Purpose |
|-------|---------|
| `auth/[...nextauth]` | NextAuth handler |
| `stripo-demo-template` | Stripo demo template helper |
| `mock/auth/...` | Mock auth for Fuse demos |

Additional pages-router API: `src/pages/api/auth/google/token.ts` (Google OAuth token exchange for Analytics).

### Documented API contracts

See `docs/api/bulk-order-status-jobs.md` for the **bulk order status jobs** contract (async start, poll, per-order item status, concurrent jobs, history UI).

---

## 8. State Management

### Redux Toolkit (`src/store/`)

- `store.ts` — store bootstrap  
- `rootReducer.ts` — combined reducers  
- `middleware.ts` — middleware wiring  
- `withReducer.tsx` / `withSlices.tsx` — lazy slice injection patterns (Fuse style)  
- Navigation slice under theme-layouts for sidebar state  

### Local / page state

- `src/hooks/usePageState.ts` — persist filters/pagination across navigation  
- `src/hooks/useDebounce.ts` — search debounce  
- `src/hooks/useFetch.ts` — fetch helper  
- `src/hooks/useColumnOrder.ts` — table column order  
- Cookies via `cookies-next`

### Forms

React Hook Form + Zod resolvers across create/edit screens; shared field components in `components/Shared`.

---

## 9. UI, Layout & Shared Components

### Layout shell

- Fuse theme layouts under `src/components/theme-layouts`
- Control-panel layout: `src/app/(control-panel)/layout.tsx`
- Navigation config: `src/configs/navigationConfig.ts`
- Themes: `themesConfig.ts`, `themeOptions.ts`, `settingsConfig.ts`

### Shared components (`src/components/Shared`)

Reusable building blocks include:

- Form fields: text, textarea, select, searchable select, checkbox, date/datetime, file upload, avatar upload  
- `FormCKEditor` — CKEditor 5 wrapper (license + cloud services via env)  
- `DeleteConfirmationModal`, `PageHeader`, `TablePagination`, `ClearFiltersButton`  
- `ImageCropperDialog` (`react-easy-crop`)  
- CKEditor HTML templates for category/additional text cards  

### Data tables

- `material-react-table` for list UIs  
- Module-specific tables (e.g. `ProductTable`, `OrdersTable`)

### Charts (dashboard)

ApexCharts wrappers: sales, transactions, user growth, statistics cards.

---

## 10. Rich Text & Email Builder

### CKEditor 5

Used heavily for blog posts, buying guides, CMS content, and related rich fields.

- Packages: `ckeditor5`, `@ckeditor/ckeditor5-react`, premium features  
- Env: `NEXT_PUBLIC_CKEDITOR_LICENSE_KEY`, `NEXT_PUBLIC_CKEDITOR_CLOUD_SERVICES_TOKEN_URL`

### Stripo email builder

Newsletter create/edit flows under:

- `/apps/newsletter/create-email-builder`
- `/apps/newsletter/edit-email-builder/[id]`

Supporting assets:

- `public/stripo-builder.html`
- `src/features/email-builder/`
- API helpers for templates / demo template

---

## 11. Environment Variables

Do **not** commit secrets. Configure via `.env` / `.env.local`. Names referenced in code:

| Variable | Usage |
|----------|--------|
| `NEXT_PUBLIC_BASE_URL` | Backend API base URL (Axios) |
| `NEXT_PUBLIC_API_URL` | Asset / API host for some image URLs (e.g. menu) |
| `NEXT_PUBLIC_WEB_URL` | Storefront base URL (SEO canonicals, menu links) |
| `NEXT_PUBLIC_PORT` | Local port for `apiFetch` in development |
| `NEXT_PUBLIC_CRYPTO_SECRET` | Cookie/token crypto helper |
| `NEXT_PUBLIC_CKEDITOR_LICENSE_KEY` | CKEditor license |
| `NEXT_PUBLIC_CKEDITOR_CLOUD_SERVICES_TOKEN_URL` | CKEditor cloud token URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth / Analytics |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret (server) |
| `NEXT_PUBLIC_REDIRECT_URL` | OAuth redirect URI |
| `NEXT_PUBLIC_GOOGLE_AUTH_SCOPE` | OAuth scopes |
| `NEXT_PUBLIC_AUTH_URL` | Google auth URL |
| `NEXT_PUBLIC_GA_PROPERTY_ID` | GA4 property id |
| `AUTH_SECRET` | NextAuth secret |
| `AUTH_KV_REST_API_URL` / `AUTH_KV_REST_API_TOKEN` | Upstash Redis for Auth.js on Vercel |
| `VERCEL` / `VERCEL_GIT_COMMIT_REF` | Platform / deploy guards |
| `NODE_ENV` | Environment mode |

---

## 12. Scripts & Local Development

### Prerequisites

- Node.js **≥ 22.12**
- npm **≥ 10.9**
- Backend API reachable at `NEXT_PUBLIC_BASE_URL`
- Local env file (`.env.local`) with required keys

### Commands

```bash
npm install
npm run dev          # next dev
npm run build        # next build
npm run start        # next start -p 3024
npm run lint         # eslint ./src
npm run lint:fix    # eslint --fix
npm run audit        # npm audit --production
```

### Postinstall

Runs `src/utils/node-scripts/fuse-react-message.js` (Fuse branding/message).

---

## 13. CI/CD & Quality

### Jenkins (`Jenkinsfile`)

1. **SonarQube Analysis** — tool `VapehubSonarTool`, env `VapehubSonar`
2. **Deploy** — only when `BRANCH_NAME == staging`:
   - SSH to localhost deploy host
   - `git pull` in `/var/www/vapehub/admin/`
   - `npm install`
   - `npm run build` with `NODE_OPTIONS=--max-old-space-size=4096`
   - `pm2 restart 'Admin'`
3. **Email** notifications on build result

### SonarQube

- Project name: **VapeHub Admin**
- Config: `sonar-project.properties`
- Quality gate wait disabled (`sonar.qualitygate.wait=false`)

### Branching (observed)

| Branch type | Examples |
|-------------|----------|
| Integration | `staging`, `staging-v2`, `develop` |
| Production | `main` |
| Features | `feat/*`, `feature/sprint-*` |
| Hotfixes | `Hotfix/*` |

Staging is the branch this documentation is based on and the branch deployed by Jenkins.

---

## 14. Routing Map

### Route groups

```
/                         → app entry
/sign-in | /sign-up | ... → (public)
/dashboards/admin         → admin dashboard
/apps/*                   → feature modules (see §5)
/api/auth/[...nextauth]   → NextAuth
```

### Control-panel apps directory

```
src/app/(control-panel)/apps/
  analytics/  attribute/  attribute-terms/  banner/  blog/
  carousel/  contact-us/  coupon/  customer/  deals/  faq/
  feature-content/  flash-news/  footer/  inventory/
  loyalty-points/  menu/  newsletter/  order/  popular-categories/
  product/  product-brand/  product-category/  product-variant/
  profile/  referral-methods/  review/  seo/  settings/
  shipping-methods/  shop-by-categories/  transaction/
  trust-strip/  users/  welcome/
```

---

## 15. Notable Feature Areas

### Bulk order status updates

- UI: `apps/order/components/BulkStatus*` + activity drawer  
- Async job start + polling + per-order item statuses  
- Contract: `docs/api/bulk-order-status-jobs.md`

### Abandoned carts

- List + period summary (daily/weekly/monthly/yearly)  
- Metrics: abandoned carts, email1/email2 sent, recovered orders/revenue, cancelled/superseded  
- Detail route per `orderId`  
- Service: `apiAbandonedCarts.ts`

### Product lifecycle flags

- `is_coming_soon`, `is_discontinued` on products/variants  
- Surfaced in product detail/update UIs

### Buying guides

- Category and brand buying guides with CKEditor content  
- Services: `apiCategoryBuyingGuide.ts`, `apiBrandBuyingGuide.ts`

### Customer export

- Initiate + poll job status endpoints under admin user export APIs

### Filter persistence

- Page filters/scroll state preserved via page-state helpers and auth clear-on-logout

### Package modernization (recent staging history)

- Next.js bumped to 15.5.25  
- `@vercel/kv` replaced with Upstash Redis  
- Deprecated CKEditor classic build / unused deps cleaned  
- Related hotfixes merged into staging

---

## 16. Conventions & Notes

### Coding patterns

- Prefer domain services in `src/services` over inline Axios in pages  
- Prefer shared form components over one-off inputs  
- Client pages often split as `*PageClient.tsx` + thin `page.tsx` server wrappers  
- Keep navigation entries in sync with new routes in `navigationConfig.ts`

### Security reminders

- Never commit `.env` / `.env.local`  
- Treat admin Bearer tokens as sensitive  
- Production builds currently ignore TS/ESLint errors — fix types/lint locally before relying on CI alone

### Upstream template

`README.md` still describes the commercial **Fuse React** theme versions (Vite vs Next). This project is the **customized Next.js admin** for VapeHub, not a stock demo.

### Related docs

| Doc | Topic |
|-----|--------|
| `PROJECT.md` | This full project overview |
| `README.md` | Fuse React upstream notes |
| `docs/api/bulk-order-status-jobs.md` | Bulk order status job API contract |
| `LICENSE` / `CREDITS` | Licensing / credits |

---

## Quick Reference

| Item | Value |
|------|--------|
| App name | VapeHub Admin (`fuse-react-app`) |
| Documented branch | `staging` |
| Framework | Next.js 15 + React 19 + MUI 6 + Fuse 14 |
| Primary API | `NEXT_PUBLIC_BASE_URL` + `/api/admin/*` |
| Start command | `npm run start` → port **3024** |
| Staging deploy | Jenkins → `/var/www/vapehub/admin/` → PM2 `Admin` |
| Service modules | ~37 API service files |
| App feature folders | ~35 under `apps/` |

---

*Generated from the `staging` branch codebase structure, navigation config, services, auth, CI, and recent commit history. Update this file when major modules, env vars, or deploy paths change.*
