# MERN Multi-Vendor E-Commerce Marketplace

A full-stack, role-based multi-vendor e-commerce marketplace built with the MERN stack.

The application provides complete customer shopping flows, vendor product and order management, administrative moderation, Stripe payment processing, refunds and returns, shipping management, secure authentication, accessibility checks, and automated testing.

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

# Technology Stack

## Frontend

- React
- React Router
- Vite
- Axios
- Context API
- CSS
- Stripe.js
- React Stripe.js

## Backend

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

## Testing

- Vitest
- React Testing Library
- Playwright
- Axe Accessibility Testing
- Node.js Test Runner
- Supertest

---

# Authentication

The application uses an access-token and refresh-token authentication architecture.

### Access Token

The short-lived JWT access token is returned to the frontend after authentication and kept in application memory.

It is sent using:

```text
Authorization: Bearer <access-token>