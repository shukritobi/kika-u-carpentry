# KIKA.U Cloudflare Pages deployment

The repository is ready for Cloudflare Pages Git integration. Once the one-time GitHub authorization is completed in the Cloudflare account, every push to `main` deploys automatically.

## One-time Cloudflare setup

1. Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize the **Cloudflare Workers & Pages** GitHub app for `shukritobi/kika-u-carpentry`.
3. Select repository: `shukritobi/kika-u-carpentry`.
4. Use these build settings:
   - Project name: `kika-u-carpentry`
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `bash ./build-pages.sh`
   - Build output directory: `dist`
   - Root directory: repository root
5. Save and deploy.

Cloudflare will detect the `/functions` directory separately and deploy the payment endpoints as Pages Functions.

## Runtime variables and secrets

After the first deployment, open the Pages project → **Settings → Variables and Secrets**.

Start with Billplz Sandbox:

### Normal variables

- `PAYMENT_PROVIDER` = `billplz`
- `PLATFORM_FEE_PERCENT` = `1`
- `PLATFORM_SPLIT_EMAIL` = the verified Billplz email belonging to the website platform
- `BILLPLZ_BASE_URL` = `https://www.billplz-sandbox.com`

### Encrypted secrets

- `BILLPLZ_SECRET_KEY`
- `BILLPLZ_X_SIGNATURE_KEY`
- `ADMIN_SETUP_TOKEN`

After creating the Billplz split collection, add:

- `BILLPLZ_COLLECTION_ID`

Do not put real payment credentials in GitHub files. `.dev.vars` and `.env*` are gitignored.

## Create the 1% Billplz split collection

Once the secrets above exist, call the protected setup endpoint once:

```bash
curl -X POST https://kika-u-carpentry.pages.dev/api/billplz-setup \
  -H "Authorization: Bearer YOUR_ADMIN_SETUP_TOKEN"
```

Copy the returned collection ID into `BILLPLZ_COLLECTION_ID`, then trigger a new deployment or update the variable and retry checkout.

## Automatic deployments

After Git integration is active:

- Push to `main` → production deployment
- Other enabled branches / pull requests → preview deployments
- No manual upload is required

## Local testing

Create a local `.dev.vars` from `.dev.vars.example`, then run Pages locally with Wrangler:

```bash
npx wrangler pages dev dist
```

Build the static bundle first:

```bash
bash ./build-pages.sh
```

Never commit `.dev.vars`.
