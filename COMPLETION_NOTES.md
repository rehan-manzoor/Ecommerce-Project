# Completion Notes

This archive was upgraded from the supplied working course project rather than rebuilt from scratch.

## Completed from the continuation brief

- Stock decrement at checkout with atomic `stock >= quantity` updates and rollback on reservation failure
- Vendor application, admin approval/rejection/suspension and enforcement before selling
- Public vendor storefront and editable store profile
- Product moderation, search, filter, sort, pagination, ratings fields and vendor ownership protection
- Category slug/hierarchy fields and admin create/delete workflow
- Coupon validation and secure server-side pricing used by Stripe PaymentIntent creation
- Review moderation, delete endpoint and product rating aggregation
- Profile edit, address book, forgot/reset password, admin users list/role/block actions
- Admin analytics + management dashboard
- Vendor analytics + product/order/store dashboard
- Console/SMTP notification service
- Guest cart with login merge
- Responsive customer storefront, home page, 404 page, toasts
- Local image uploads with file type/size validation
- `.env.example` files, migration script, admin-creation script and root README

## Deliberate local-development choices

- Uploaded images remain on local disk (`server/uploads`).
- Password reset messages log to the backend console if SMTP is not configured.
- Stripe remains in test-mode workflow with Stripe CLI webhooks.
- No Docker/deployment/CI was added because the supplied specification scopes this project to local development.
