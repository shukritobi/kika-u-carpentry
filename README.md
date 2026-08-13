# KIKA.U Website

Static storefront + Cloudflare Pages Function checkout for KIKA.U / Karya Perkasa Industries.

## Deploy

Deploy the repository with Cloudflare Pages. No build command is required. Output directory: `/`.

## Herepay environment variables

Add these secrets in Cloudflare Pages > Settings > Environment variables:

- `HEREPAY_API_KEY`
- `HEREPAY_SECRET_KEY`
- `HEREPAY_PRIVATE_KEY`
- `HEREPAY_BASE_URL` = `https://uat.herepay.org` for UAT, then `https://app.herepay.org` for production

The server-side checkout validates product prices, generates the Herepay HMAC-SHA256 checksum, and initiates FPX without exposing secrets to the browser.

Before production launch, confirm current product price, stock, dimensions, delivery fees, lead time, Herepay callback settings and live credentials with KIKA.U.
