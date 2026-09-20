# MERN Multi-Vendor E-Commerce Marketplace

A full-stack multi-vendor e-commerce marketplace built with the MERN stack.

The application supports customer shopping flows, vendor management, administrative moderation, secure authentication, cart and wishlist management, order processing, product moderation, returns, refunds, shipping configuration, coupons, reviews, analytics, and automated testing.

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Context API
- CSS
- Vitest
- React Testing Library
- Playwright
- Axe Accessibility Testing

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- HttpOnly Cookies
- bcrypt
- Zod Validation
- Multer
- Stripe integration
- Express Rate Limit
- Helmet
- CORS

---

# Main Features

## Customer

Customers can:

- Register
- Login
- Logout
- Maintain authenticated sessions
- View profile
- Manage addresses
- Browse products
- View product details
- Search products
- Filter and sort products
- Browse categories
- Add products to cart
- Remove products from cart
- Maintain guest and authenticated carts
- Add products to wishlist
- Remove products from wishlist
- Apply coupons
- Select shipping methods
- Checkout
- View orders
- Submit reviews
- Browse vendor storefronts

---

## Vendor

Vendors can:

- Access a dedicated vendor dashboard
- Manage store information
- View vendor analytics
- Create products
- Edit products
- Delete products
- Manage stock
- Configure SKU
- Configure sale pricing
- Configure low-stock thresholds
- Manage product listing status
- View vendor orders
- Manage fulfillment
- Manage returns

New vendor products are subject to administrative moderation.

---

## Administrator

Administrators have access to a dedicated control center.

Admin functionality includes:

- Marketplace overview
- Vendor management
- Vendor application moderation
- Product moderation
- Order management
- User management
- Review moderation
- Category management
- Coupon management
- Return management
- Refund management
- Shipping method management
- Marketplace analytics

---

# Product System

Products support information such as:

- Name
- Description
- Brand
- SKU
- Base price
- Sale price
- Stock
- Low-stock threshold
- Category
- Vendor
- Listing status
- Approval status

The marketplace supports an administrative product approval workflow.

---

# Authentication & Security

The project includes several security protections.

### Authentication

- JWT-based authentication
- Short-lived access tokens
- Refresh token support
- HttpOnly cookie-based refresh sessions
- Protected routes
- Role-based authorization
- Customer, vendor, and admin access control

### Security

- Helmet security headers
- CORS configuration
- Authentication rate limiting
- Request validation
- Centralized error handling
- Password hashing with bcrypt
- CSRF protection for sensitive authentication operations
- Secure cookie configuration
- Role-based backend authorization

---

# CSRF Protection

Sensitive cookie-authenticated operations use CSRF protection.

The frontend retrieves a CSRF token and sends it through the required request header for protected operations such as authentication refresh and logout.

---

# Shopping Cart

The cart supports:

- Guest cart
- Authenticated cart
- Product quantities
- Product removal
- Cart persistence
- Server-backed cart operations
- Cart mutation validation

Automated E2E tests verify real add-to-cart and remove-from-cart flows.

---

# Wishlist

Authenticated customers can:

- Save products
- Load saved products
- Remove products from their wishlist

---

# Orders & Checkout

Checkout supports:

- Shipping addresses
- Shipping methods
- Coupon handling
- Server-calculated order totals
- Tax handling
- Order creation
- Multi-vendor order structure

Customers can view their previous orders from their account.

---

# Payments

The project contains Stripe payment integration.

For local development and testing, payment functionality can be used with Stripe test/dummy payment credentials.

No production payment deployment is required for this project.

---

# Product Moderation Workflow

A complete automated E2E workflow verifies:

```text
Vendor creates product
        ↓
Product enters pending moderation
        ↓
Admin reviews product
        ↓
Admin approves product
        ↓
Approved product becomes publicly available