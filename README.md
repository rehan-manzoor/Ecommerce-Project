# MERN Market — Local Multi-Vendor Marketplace

A React, Express, MongoDB Community Server and Stripe test-mode marketplace. Customers can shop from approved sellers; each seller fulfills only their own part of a mixed-seller order. Admins moderate vendors, products, reviews and returns.

## Features

| Customer | Seller | Admin |
| --- | --- | --- |
| Registration, login, rotating cookie session, profile, saved addresses, password reset | Seller application and store profile | Approve/suspend sellers and moderate listings |
| Catalog search/filter/sort, variant selection, guest/cart merge, wishlist | Create/edit/retire products with images and variants | Manage users, categories, coupons and shipping methods |
| Coupons, server-priced checkout, Stripe test payment, orders and tracking | Seller-only order fulfillment and sales overview | View mixed-seller orders, analytics, returns and Stripe refunds |
| Verified-purchase reviews, cancellation, returns and notifications | Independent tracking numbers, inventory indicators | Review moderation and order tracking |

Security includes Helmet, restricted CORS, rate limits on account/payment endpoints, Zod validation for the main purchase routes, short-lived JWTs, rotated HttpOnly refresh cookies, live account/role checks, guarded uploads, unique account/review indexes and centralized API errors. SMTP is optional; in local development password-reset and order messages are logged by the backend when SMTP isn't configured.

## Structure

- `client/src/pages` — storefront, account, checkout, seller and admin views.
- `client/src/api` and `context` — API calls and session handling.
- `server/routes` and `controllers` — API endpoints.
- `server/models` — MongoDB schemas.
- `server/services` — catalog pricing, coupons, refunds and mail.
- `server/tests` and `client/src/tests` — automated checks.

## Local prerequisites and setup (Windows PowerShell)

Install Node.js (v22+), npm and MongoDB Community Server. Start the local MongoDB service in Windows Services, or run `mongod` with a writable data directory. A normal standalone server works; this application does not require Atlas or a replica set. Install Stripe CLI only when testing webhooks.

In PowerShell, from the extracted `mern-ecommerce-2` directory:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Edit both `.env` files. Set long random `JWT_ACCESS_SECRET`, Stripe **test** secret/publishable keys and the local database URL. The example `MONGO_URI=mongodb://127.0.0.1:27017/mern_ecommerce` is sufficient for a local MongoDB Community Server. `MONGODB_URI` remains supported for older configurations. Never commit the `.env` files.

Terminal 1:

```powershell
cd server
npm install
npm run migrate:marketplace
npm run dev
```

Terminal 2:

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. `npm run create-admin -- your@email.com StrongPassword123 "Admin Name"` in the server folder creates an intentional admin; inspect `server/scripts/createAdmin.js` for accepted arguments. Use the Admin screen to add a shipping method, category, approve a seller, then approve a product before browsing. If no active shipping methods exist, local checkout uses free shipping. `TAX_RATE=0.05` means five percent of subtotal after coupon discount; prices and totals are calculated on the server. Existing product data is retained.

## Stripe test flow

Set `STRIPE_SECRET_KEY=sk_test_...` in `server/.env` and `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` in `client/.env`. Start the Stripe CLI locally:

```powershell
stripe login
stripe listen --forward-to http://localhost:5000/api/payments/webhook
```

Copy the CLI's `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart the server. Use a Stripe test card such as `4242 4242 4242 4242`, a future expiry and any CVC in the Stripe Payment Element. No real charge is required. Test cancellation and returns with the same Stripe test account; refunds are created using Stripe's Refund API. Webhook events update local payment/refund records.

## API overview

| Area | Main routes |
| --- | --- |
| Session | `POST /api/users`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password/:token`; `GET /api/users/me` |
| Catalog | `GET /api/categories`, `/api/products`, `/api/products/:id`; seller CRUD under `/api/products`; moderation under `/api/products/:id/moderate` |
| Shopping | `/api/cart`, `/api/wishlist`, `POST /api/coupons/validate`, `GET /api/shipping` |
| Payment/order | `POST /api/payments/create-intent`, `/api/payments/webhook`, `/api/orders`; `GET /api/orders/my`, `/vendor/mine`; `POST /api/orders/:id/vendors/:vendorId/cancel` |
| After-sales | `/api/reviews`, `/api/returns/my`, `/api/returns/manage`, `/api/notifications` |
| Management | `/api/admin/analytics/*`, `/api/admin/orders`, `/api/vendors`, `/api/shipping/admin` |

Success returns `{ success: true, data, message? }`; failures return `{ success: false, message, errors? }`. Seller and admin writes are authorized on the server.

## Tests and limitations

```powershell
cd server
npm test
cd ../client
npm test
npm run lint
npm run build
```

Tests exercise route protection, seller-group isolation, variant pricing and inventory checks, and wishlist UI actions without calling real Stripe or MongoDB. A full local end-to-end purchase, webhook, refund and email delivery must be verified with your running MongoDB and Stripe test keys. There is no carrier API; tracking numbers are entered by a seller/admin. Local MongoDB standalone uses atomic stock updates and compensation on failed order creation, but multi-document order/payment/coupon actions are **not transactionally atomic**; interrupted processes can need manual reconciliation. A paid checkout whose cart or stock changes is refunded rather than silently creating an incorrect order. Legacy orders are grouped per seller by `npm run migrate:marketplace`; inspect any duplicate reviews flagged by that command before building the unique user/product index. The customer return window is 14 days after delivery. Currency is USD in Stripe test mode and product catalog.

Add portfolio screenshots here after verifying the running screens locally.
