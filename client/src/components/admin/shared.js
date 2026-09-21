export const ORDER_STATUSES = ["processing", "shipped", "delivered"];

export const USER_ROLES = ["customer", "vendor", "admin"];

export const TABS = [
  "overview",
  "vendors",
  "products",
  "orders",
  "reviews",
  "categories",
  "coupons",
  "users",
  "returns",
  "shipping",
];

export const EMPTY_CATEGORY = {
  name: "",
  description: "",
  parentCategory: "",
  isActive: true,
};

export const EMPTY_COUPON = {
  code: "",
  discountType: "percentage",
  discountValue: 10,
  minPurchaseAmount: 0,
  expiresAt: "",
  active: true,
};

export const capitalize = (word) => word[0].toUpperCase() + word.slice(1);

export const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export const shortId = (id) => `#${id.slice(-8).toUpperCase()}`;
