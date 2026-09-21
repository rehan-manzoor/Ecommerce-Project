# MERN Multi-Vendor E-Commerce Marketplace

A full-stack, role-based multi-vendor e-commerce marketplace built with the MERN stack.

The application supports complete customer shopping flows, vendor product and order management, administrative moderation, Stripe payment processing, refunds and returns, shipping management, secure authentication, persistent cloud image uploads, email notifications, accessibility checks, automated testing, and production deployment.

---

## Features

### Customer

Customers can:

- Register and log in
- Maintain authenticated sessions
- Log out securely
- Manage profile information
- Manage shipping addresses
- Browse products
- View product details
- Search products
- Filter and sort products
- Browse categories
- Add and remove cart items
- Use a guest cart
- Merge guest cart after login
- Manage wishlist
- Apply coupons
- Select shipping methods
- Checkout securely
- View previous orders
- Cancel eligible vendor orders
- Request returns
- View return requests
- Submit product reviews
- Browse vendor storefronts

---

### Vendor

Approved vendors can:

- Access a dedicated vendor dashboard
- Manage store information
- View vendor analytics
- Create products
- Edit products
- Delete products
- Manage product stock
- Manage product variants
- Configure SKU values
- Configure sale pricing
- Configure low-stock thresholds
- Manage product availability
- Upload product images
- View vendor-specific orders
- Process fulfillment
- Add tracking information
- Manage eligible return requests

New vendor products require administrative approval before appearing publicly.

---

### Administrator

Administrators have access to a dedicated marketplace control center.

Admin functionality includes:

- Marketplace overview
- Revenue and order statistics
- Vendor application moderation
- Vendor management
- Product moderation
- Order management
- User management
- Review moderation
- Category management
- Coupon management
- Return management
- Refund processing
- Shipping method management
- Marketplace analytics

---

## Technology Stack

### Frontend

- React
- React Router
- Vite
- Axios
- Context API
- CSS
- Stripe.js
- React Stripe.js

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Zod
- Multer
- Stripe
- Nodemailer
- Helmet
- CORS
- Express Rate Limit

### Cloud Services

- Vercel
- MongoDB Atlas
- Cloudinary
- Stripe
- Gmail SMTP

### Testing

- Vitest
- React Testing Library
- Playwright
- Axe Accessibility Testing
- Node.js Test Runner
- Supertest

---

## Authentication

The application uses an access-token and refresh-token authentication architecture.

### Access Token

The short-lived JWT access token is returned to the frontend after authentication and kept in application memory.

It is sent using:

```text
Authorization: Bearer <access-token>
```

### Refresh Token

Refresh tokens are:

- Generated securely
- Stored in HttpOnly cookies
- Hashed before being stored in MongoDB
- Rotated when a session is refreshed
- Removed during logout
- Invalidated during password reset

This allows authenticated sessions to be restored after a browser refresh.

---

## CSRF Protection

Sensitive cookie-authenticated routes use CSRF protection.

Protected operations include:

```text
POST /api/users/refresh
POST /api/users/logout
```

The server issues a CSRF token cookie and the frontend sends the corresponding token in:

```text
X-CSRF-Token
```

Token comparison uses timing-safe comparison.

---

## Role-Based Authorization

The application supports three main roles:

```text
customer
vendor
admin
```

Backend middleware enforces authorization independently of frontend routing.

Examples:

- Customers cannot access admin routes
- Customers cannot access vendor dashboards
- Vendors can only manage their authorized marketplace data
- Only administrators can perform marketplace-wide moderation operations

---

## Rate Limiting

Authentication routes use rate limiting to reduce brute-force attempts.

Payment creation is also rate limited.

For local automated E2E testing, the authentication limiter can be bypassed only when:

```text
E2E_TEST=true
```

and the server is not running in production mode.

The backend is configured to trust the deployment proxy when running behind Vercel.

---

## Product System

Products support:

- Name
- Description
- Slug
- Brand
- Category
- Vendor
- SKU
- Base price
- Sale price
- Stock
- Low-stock threshold
- Tags
- Specifications
- Product variants
- Variant stock
- Variant pricing
- Multiple images
- Featured status
- Listing status
- Approval status
- Average rating
- Review count

MongoDB indexes support common filtering and text search operations.

---

## Product Moderation

Vendor products follow an approval workflow:

```text
Vendor creates product
        ↓
Product becomes pending
        ↓
Administrator reviews product
        ↓
Administrator approves product
        ↓
Product becomes publicly available
```

This workflow is covered by automated Playwright tests.

---

## Product Variants

Products can contain variants with independent:

- Attributes
- SKU
- Price
- Stock

Cart and order operations preserve the selected variant.

Inventory checks operate against the correct variant inventory.

---

## Product Image Uploads

Production image uploads are stored in Cloudinary.

Supported formats:

```text
JPEG
PNG
WebP
```

Upload security includes:

- MIME type validation
- File extension validation
- File-size limits
- Actual file-signature validation
- Vendor/admin authorization
- Cloud-hosted storage
- Cloudinary-generated asset identifiers
- HTTPS image delivery

The application uses in-memory Multer storage before securely uploading validated files to Cloudinary.

---

## Shopping Cart

The cart supports:

- Guest cart
- Authenticated cart
- Product quantities
- Product variants
- Cart persistence
- Add-to-cart validation
- Quantity updates
- Product removal
- Guest-cart merging after login

Backend validation prevents invalid quantities and unavailable inventory selections.

---

## Wishlist

Authenticated customers can:

- Save products
- Load saved products
- Remove products from their wishlist

---

## Coupons

The marketplace supports coupon rules such as:

- Percentage discounts
- Fixed discounts
- Minimum order values
- Maximum discounts
- Usage limits
- Expiry dates
- Product restrictions
- Category restrictions
- Vendor restrictions

Discount calculations are performed on the server.

---

## Shipping

Administrators can configure shipping methods.

Checkout pricing can include:

- Product subtotal
- Coupon discount
- Shipping cost
- Tax
- Final order total

The backend calculates the authoritative checkout amount.

---

## Stripe Payments

Stripe PaymentIntent integration is included.

The payment flow is:

```text
Customer cart
     ↓
Server calculates authoritative pricing
     ↓
PaymentIntent created
     ↓
Customer completes Stripe payment
     ↓
Server verifies PaymentIntent
     ↓
Order is created
```

The backend verifies:

- PaymentIntent status
- Paid amount
- Currency
- User ownership
- Cart snapshot
- Current cart state

Stripe currently runs in test mode for the deployed portfolio environment.

---

## Stripe Webhooks

Stripe webhook processing uses the original raw request body.

Supported webhook events include:

```text
payment_intent.succeeded
payment_intent.payment_failed
refund.updated
```

Webhook signatures are verified using the configured Stripe webhook secret.

Production webhook endpoint:

```text
https://ecommerce-api-rehan-27b3.vercel.app/api/payments/webhook
```

---

## Multi-Vendor Orders

Orders contain vendor-specific groups.

Each vendor group can store:

- Vendor
- Vendor products
- Vendor subtotal
- Fulfillment status
- Tracking carrier
- Tracking number
- Shipment time
- Delivery time
- Cancellation information
- Status history

Vendors can access and manage their own vendor order groups.

---

## Inventory Protection

Inventory is checked before order creation.

Stock reduction uses atomic MongoDB update conditions.

If a later reservation operation fails, previously reserved inventory is restored.

The application also verifies that the cart still matches the payment snapshot before creating an order.

---

## Order Cancellation

Eligible vendor-order groups can be cancelled.

Cancellation includes:

- Authorization checks
- Cancellation reason validation
- Stripe refund processing
- Inventory restoration
- Order status recalculation
- Refund notification

---

## Returns

Customers can request returns for eligible delivered products.

Rules include:

- Product must have been delivered
- Return must be inside the return window
- Requested quantity cannot exceed the purchased quantity
- A return reason is required

Return states include:

```text
requested
approved
rejected
item_received
refund_processing
refunded
```

Vendors manage operational return stages while refund-sensitive stages are restricted appropriately.

---

## Refunds

Refunds are processed through Stripe.

Refund-related information can include:

- Stripe refund ID
- Refund amount
- Reason
- Status

Webhook updates can synchronize successful refund states with return requests and vendor order status.

---

## Reviews

Customers can submit product reviews.

The product system maintains:

- Average rating
- Review count

Administrative review moderation is also available.

---

## Notifications

The application supports notifications for events such as:

- Order creation
- Shipping updates
- Returns
- Refunds

---

## Email Notifications

Email infrastructure uses Nodemailer with SMTP configuration.

Supported email flows include:

- Welcome email
- Password reset email
- Order confirmation
- Order status updates
- Vendor approval updates

In production, email delivery is configured using SMTP credentials.

For local development, if SMTP credentials are not configured, email content falls back to server console logging.

---

## Password Reset

The password-reset flow uses cryptographically generated reset tokens.

The backend stores the token hash rather than the raw token.

Reset tokens expire automatically.

Successful password reset also invalidates existing refresh-token sessions.

Production reset links point to the deployed frontend application.

---

## Security Features

Security measures include:

- Helmet
- Restricted CORS configuration
- Password hashing
- JWT authentication
- HttpOnly refresh-token cookies
- Secure production cookies
- Refresh-token hashing
- Refresh-token rotation
- Role-based authorization
- CSRF protection
- Authentication rate limiting
- Payment rate limiting
- Zod request validation
- Upload validation
- Cloud-hosted media storage
- Centralized error handling
- Generic public server errors
- Stripe webhook verification
- Server-side pricing
- Server-side authorization
- Inventory validation
- Reverse-proxy trust configuration
- Environment-based secrets

---

## Accessibility

The frontend includes automated accessibility testing using:

```text
@axe-core/playwright
```

Tests check for serious and critical WCAG-related accessibility violations.

Accessibility improvements include:

- Accessible form labels
- Improved text contrast
- Accessible navigation
- Accessible button names
- Footer contrast improvements
- Product fallback-text contrast improvements

---

## Automated Testing

The project contains multiple testing layers.

### Frontend Unit and Integration Tests

Run:

```bash
cd client
npm test
```

Current verified result:

```text
Test Files: 5 passed
Tests:      38 passed
```

Covered areas include:

- Cart
- Checkout
- Orders
- Wishlist
- Payment

---

### Backend Tests

Run:

```bash
cd server
npm test
```

Current verified result:

```text
18 passed
0 failed
```

Backend tests cover functionality including:

- Health endpoint
- Missing routes
- Registration validation
- Admin authorization
- Vendor authorization
- Product authorization
- Coupon calculations
- Coupon expiration
- Coupon usage limits
- Product variants
- Server-side checkout pricing
- Overselling protection
- Return authorization
- Return creation
- Refund calculation
- Return quantities
- Return reason validation
- Delivery validation
- Return window validation
- Customer return retrieval

---

## End-to-End Tests

Playwright is used for full browser testing.

Run:

```bash
cd client
npm run e2e
```

Current verified suite:

```text
48 tests passed
```

Coverage includes:

- Public pages
- Product catalog
- Authentication
- Session persistence
- Logout
- Route protection
- Customer authorization
- Vendor authorization
- Admin authorization
- Customer cart mutations
- Vendor dashboard
- Vendor product CRUD
- Admin dashboard
- Admin tabs
- Product moderation workflow
- Accessibility

---

## Code Quality

Run frontend linting:

```bash
cd client
npm run lint
```

Run a production build:

```bash
npm run build
```

The frontend has been verified successfully with ESLint and the Vite production build process.

---

## Dependency Security

Dependency security can be checked with:

```bash
npm audit
```

Current verified status:

```text
Client: 0 vulnerabilities
Server: 0 vulnerabilities
```

---

## Project Structure

```text
Ecommerce-Project/
│
├── client/
│   ├── e2e/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   └── vendor/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── tests/
│   │   └── utils/
│   │
│   ├── eslint.config.js
│   ├── playwright.config.js
│   ├── vercel.json
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── db.js
│   │   └── stripe.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

---

## Requirements

Install:

- Node.js 20+
- npm
- Git

For local development:

- MongoDB Community Server

Optional:

- MongoDB Compass
- Stripe CLI

Production services use:

- MongoDB Atlas
- Vercel
- Cloudinary
- Stripe
- SMTP

---

## Backend Installation

Open PowerShell or a terminal:

```bash
cd server
npm install
```

Copy:

```text
.env.example
```

to:

```text
.env
```

Example local configuration:

```env
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/mern_ecommerce

CLIENT_URL=http://localhost:5173

JWT_ACCESS_SECRET=replace_with_a_secure_secret
JWT_ACCESS_EXPIRES=15m

STRIPE_SECRET_KEY=your_stripe_test_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Never commit real secrets.

---

## Start Backend

Make sure MongoDB Community Server is running.

Then:

```bash
cd server
npm run dev
```

Expected:

```text
MongoDB connected successfully
Server running on http://localhost:5000
```

Backend health endpoint:

```text
http://localhost:5000/api/health
```

---

## Frontend Installation

Open another terminal:

```bash
cd client
npm install
```

Copy:

```text
.env.example
```

to:

```text
.env
```

Example local configuration:

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_test_publishable_key
```

Start frontend:

```bash
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

---

## Creating an Administrator

The backend includes an administrator helper script.

Run:

```bash
cd server
npm run create-admin -- admin@example.com Password123 Admin
```

When creating an administrator for MongoDB Atlas, make sure `MONGODB_URI` points to the Atlas database before running the command.

---

## Product Seeding

The backend includes a product seeding utility.

An approved vendor must exist before products are seeded.

Run:

```bash
cd server
npm run seed:products
```

Or from the project root:

```bash
npm run seed:products --prefix server
```

---

## E2E Testing

Authenticated browser tests require dedicated test accounts.

Set the following environment variables:

```text
E2E_CUSTOMER_EMAIL
E2E_CUSTOMER_PASSWORD

E2E_VENDOR_EMAIL
E2E_VENDOR_PASSWORD

E2E_ADMIN_EMAIL
E2E_ADMIN_PASSWORD
```

PowerShell example:

```powershell
$env:E2E_CUSTOMER_EMAIL="customer-email"
$env:E2E_CUSTOMER_PASSWORD="customer-password"

$env:E2E_VENDOR_EMAIL="vendor-email"
$env:E2E_VENDOR_PASSWORD="vendor-password"

$env:E2E_ADMIN_EMAIL="admin-email"
$env:E2E_ADMIN_PASSWORD="admin-password"
```

Do not commit E2E account passwords.

---

## Backend E2E Mode

For local automated browser testing:

```powershell
cd server

$env:E2E_TEST="true"

npm run dev
```

The E2E authentication-rate-limit bypass is disabled automatically in production mode.

---

# Production Deployment

The project is deployed using separate frontend and backend Vercel projects.

## Production Services

- Frontend: Vercel
- Backend API: Vercel
- Database: MongoDB Atlas
- Product images: Cloudinary
- Payments: Stripe test mode
- Email delivery: SMTP

---

## Production Frontend

```text
https://ecommerce-frontend-bay-one.vercel.app
```

---

## Production Backend

```text
https://ecommerce-api-rehan-27b3.vercel.app
```

---

## Production API Health Check

```text
https://ecommerce-api-rehan-27b3.vercel.app/api/health
```

---

## Frontend Production Environment Variables

```env
VITE_API_URL=/api
VITE_STRIPE_PUBLISHABLE_KEY=
```

The frontend uses a Vercel rewrite to proxy `/api/*` requests to the backend API.

Example Vercel rewrite:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ecommerce-api-rehan-27b3.vercel.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration also supports direct navigation to React Router routes.

---

## Backend Production Environment Variables

```env
NODE_ENV=production

MONGODB_URI=
CLIENT_URL=

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES=15m

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Real secret values must never be committed to GitHub.

---

## MongoDB Atlas

The production backend uses MongoDB Atlas instead of the local MongoDB Community Server.

The application connects using:

```text
MONGODB_URI
```

Production database data includes:

- Users
- Vendors
- Categories
- Products
- Carts
- Orders
- Payments
- Reviews
- Wishlists
- Returns
- Coupons
- Shipping methods
- Notifications

---

## Cloudinary Production Storage

Production product images are uploaded to Cloudinary rather than the Vercel filesystem.

Uploaded image URLs use Cloudinary-hosted URLs such as:

```text
https://res.cloudinary.com/...
```

This prevents uploaded files from disappearing after serverless redeployments.

---

## Stripe Production Integration

The deployed application uses Stripe in test mode.

Stripe test payments can be performed using:

```text
4242 4242 4242 4242
```

Example expiry:

```text
12/34
```

Example CVC:

```text
123
```

No real payments are processed while Stripe remains in test mode.

---

## Stripe Webhook Deployment

Production webhook endpoint:

```text
https://ecommerce-api-rehan-27b3.vercel.app/api/payments/webhook
```

Configured events:

```text
payment_intent.succeeded
payment_intent.payment_failed
refund.updated
```

The webhook signing secret is stored in:

```text
STRIPE_WEBHOOK_SECRET
```

---

## Production Email Configuration

Transactional emails use SMTP configuration.

Production variables include:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

The deployed application has working email flows for:

- Welcome emails
- Password reset emails
- Order confirmation emails
- Order status notifications
- Vendor approval notifications

---

## Full Verification

### Backend

```bash
cd server

npm test
npm audit
```

### Frontend

```bash
cd client

npm run lint
npm run build
npm test
npm audit
npm run e2e
```

A successful verification should include:

```text
Backend tests              PASS
Frontend lint              PASS
Frontend production build  PASS
Frontend unit tests        PASS
Playwright E2E             PASS
Dependency audit           PASS
```

---

## Current Verification Status

```text
Backend tests              18 / 18 PASS
Frontend tests             38 / 38 PASS
Playwright tests           48 / 48 PASS
Frontend ESLint            PASS
Vite production build      PASS
Client npm audit           0 vulnerabilities
Server npm audit           0 vulnerabilities

MongoDB local connection   PASS
MongoDB Atlas connection   PASS

Frontend deployment        PASS
Backend deployment         PASS

Customer registration      PASS
Customer login             PASS
Session restoration        PASS
Logout                     PASS

Admin authentication       PASS
Vendor workflow            PASS
Vendor approval            PASS

Product seeding            PASS
Product browsing           PASS
Product CRUD               PASS
Product moderation         PASS

Cloudinary image upload    PASS
Cloud image persistence    PASS

Cart mutation              PASS
Wishlist                   PASS
Checkout                   PASS

Stripe PaymentIntent       PASS
Stripe test payment        PASS
Stripe webhook delivery    PASS
Order creation             PASS

SMTP email delivery        PASS
Welcome email              PASS
Password reset email       PASS
Password reset flow        PASS

Role authorization         PASS
CSRF authentication flow   PASS
Rate limiting              PASS
Accessibility testing      PASS
```

---

## Deployment Architecture

```text
Browser
   ↓
Vercel Frontend
React + Vite
   ↓
/api proxy
   ↓
Vercel Backend
Node.js + Express
   ↓
MongoDB Atlas

Product Images
   ↓
Cloudinary

Payments
   ↓
Stripe

Transactional Email
   ↓
SMTP
```

---

## Current Deployment Scope

The deployed application is intended as a professional portfolio and demonstration marketplace.

The project includes a functioning cloud deployment with:

- Public frontend
- Public API
- Cloud database
- Persistent cloud image storage
- Test payment processing
- Stripe webhook handling
- Transactional email delivery
- Authentication
- Authorization
- Multi-vendor workflows
- Admin workflows

Stripe remains in test mode, therefore no real customer payments are processed.

---

## Production Considerations Before Real Commercial Use

Before operating the marketplace as a real commercial business, additional operational work would be recommended, including:

- Stripe live-mode activation
- Production payment verification
- Custom frontend domain
- Custom backend domain
- Privacy policy
- Terms and conditions
- Refund policy
- Cookie policy
- Formal security review
- Centralized production logging
- Error monitoring
- Uptime monitoring
- Database backups
- Disaster recovery planning
- Transactional email provider hardening
- CDN and caching optimization
- CI/CD approval controls
- Production analytics
- Rate-limit monitoring
- Dependency update automation

---

## Possible Future Improvements

Future improvements could include:

- Redis caching
- Queue-based email processing
- Advanced search infrastructure
- Product recommendations
- Real-time notifications
- WebSocket support
- Advanced seller reporting
- Multi-device refresh-session management
- MongoDB transactions on supported replica-set workflows
- Centralized logging
- Error tracking
- Analytics dashboards
- Performance monitoring
- CDN optimization
- Automated backups
- Additional E2E scenarios
- Dedicated CI/CD deployment pipeline
- Custom domain support

---

## Repository

GitHub:

```text
https://github.com/rehan-manzoor/Ecommerce-Project
```

---

## Live Application

Frontend:

```text
https://ecommerce-frontend-bay-one.vercel.app
```

Backend:

```text
https://ecommerce-api-rehan-27b3.vercel.app
```

Health check:

```text
https://ecommerce-api-rehan-27b3.vercel.app/api/health
```

---

## License

This project is intended for educational, portfolio, demonstration, and learning purposes.
