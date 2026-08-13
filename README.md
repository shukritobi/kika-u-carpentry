# KIKA.U Website

Lightweight static storefront for KIKA.U / Karya Perkasa Industries, deployed on Cloudflare Pages with Pages Functions for payment checkout.

## Deployment

This repository is prepared for Cloudflare Pages Git integration.

Use these one-time settings when connecting the repository in Cloudflare:

- Repository: `shukritobi/kika-u-carpentry`
- Production branch: `main`
- Framework preset: `None`
- Build command: `bash ./build-pages.sh`
- Build output directory: `dist`
- Root directory: repository root

After the Git integration is authorized, every push to `main` automatically publishes the production website. Pull-request / branch preview deployments can also be enabled in Cloudflare.

The build script copies only the deployable static website into `dist`; Cloudflare discovers the server-side payment endpoints separately from `/functions`.

Payment credentials must be stored as encrypted Cloudflare Pages secrets, never committed to GitHub. See `CLOUDFLARE_DEPLOY.md` and `.dev.vars.example`.

## Catalogue sources

The 2026 catalogue content was extracted from the shared KIKA.U Canva catalogue. Public Instagram project imagery supplied in the project screenshots was cropped and compressed to WebP for the site.

Current online-checkout price book is intentionally limited to the four models with sufficiently clear promo pricing:

- Mobile Cart — RM799
- Node Cart — RM899
- PopLite — RM699
- Tanjak Go — RM650

KaunterGo, SampirGo, custom units, Candy Wall, finishes and add-ons are displayed as enquiry/quotation items until KIKA.U reconfirms stock, specification and current price.

## Recommended payment architecture: Billplz + 1% Split Rule

For the free-website / transaction-fee business model, use the **merchant's Billplz account as collection owner** and the platform's verified Billplz account as a **1% Split Rule recipient**. This keeps the platform fee logically separate from the payment-gateway fee.

Billplz environment variables:

- `PAYMENT_PROVIDER=billplz`
- `BILLPLZ_SECRET_KEY` — KIKA.U merchant API Secret Key
- `BILLPLZ_COLLECTION_ID` — collection containing the verified Split Rule
- `BILLPLZ_BASE_URL=https://www.billplz-sandbox.com` for sandbox, `https://www.billplz.com` for production
- `BILLPLZ_X_SIGNATURE_KEY` — X Signature key for callback verification
- `PLATFORM_SPLIT_EMAIL` — email of the platform's verified Billplz account
- `PLATFORM_FEE_PERCENT=1`
- `ADMIN_SETUP_TOKEN` — long random secret protecting `/api/billplz-setup`
- optional `BILLPLZ_COLLECTION_TITLE`
- optional Cloudflare KV binding named `ORDERS_KV`

### Create the split collection

After setting the variables, create the collection once:

```bash
curl -X POST https://YOUR-DOMAIN/api/billplz-setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN"
```

Copy the returned `collection_id` into `BILLPLZ_COLLECTION_ID`, redeploy, then test in Billplz Sandbox before production.

At checkout the server re-validates the price book and confirms that the configured collection still contains the exact `PLATFORM_SPLIT_EMAIL` and `PLATFORM_FEE_PERCENT` Split Rule before it creates a Bill.

## Billplz endpoints implemented

- `POST /api/checkout` — validates cart, verifies Split Rule, creates Bill, redirects directly to selected FPX bank
- `POST /api/billplz-setup` — one-time protected V4 collection creation with 1% split
- `POST /api/billplz-callback` — verifies Billplz X Signature and optionally records status to `ORDERS_KV`
- `GET /api/payment-status?id=...` — server-side Bill status verification for the return page

## Herepay fallback

The prior Herepay FPX integration remains available with:

- `PAYMENT_PROVIDER=herepay`
- `HEREPAY_API_KEY`
- `HEREPAY_SECRET_KEY`
- `HEREPAY_PRIVATE_KEY`
- `HEREPAY_BASE_URL=https://uat.herepay.org` for UAT or `https://app.herepay.org` for production

When `PLATFORM_FEE_PERCENT` is above zero, Herepay checkout is blocked by default because this integration does not have a verified native arbitrary 1% Split Rule. It can only be forced with `ALLOW_HEREPAY_WITHOUT_SPLIT=true`, which should not be used for the transaction-fee model.

## Before launch

Confirm the live product prices, stock, lead time, shipping/delivery calculation and quotation-only products with KIKA.U. Use Billplz Sandbox and Herepay UAT before any live transactions.
