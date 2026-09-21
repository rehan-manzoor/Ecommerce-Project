import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
process.env.JWT_ACCESS_SECRET = "local-test-secret";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.NODE_ENV = "test";
const [{ default: app }, { default: User }, { default: Vendor }, { default: Order }] =
  await Promise.all([
    import("../app.js"),
    import("../models/User.js"),
    import("../models/Vendor.js"),
    import("../models/Order.js"),
  ]);
const originals = { user: User.findById, vendor: Vendor.findOne, order: Order.find };
const customerId = "68aa00000000000000000001";
const vendorId = "68aa00000000000000000002";
const storeId = "68aa00000000000000000003";
const strangerStore = "68aa00000000000000000004";
const token = (id) => jwt.sign({ userId: id }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
before(() => {
  User.findById = (id) => ({
    select: async () => ({
      _id: { toString: () => String(id) },
      email: "test@example.com",
      role: String(id) === vendorId ? "vendor" : "customer",
      isBlocked: false,
    }),
  });
  Vendor.findOne = async () => ({ _id: { toString: () => storeId }, status: "approved" });
  Order.find = (filter) => {
    assert.equal(String(filter["vendorOrders.vendor"]), storeId);
    return {
      populate: () => ({
        sort: async () => [
          {
            _id: "order-1",
            user: { name: "Buyer" },
            totalAmount: 1000,
            items: [
              { vendor: storeId, name: "Ours" },
              { vendor: strangerStore, name: "Theirs" },
            ],
            vendorOrders: [
              {
                vendor: { _id: storeId },
                subtotal: 25,
                items: [{ name: "Ours" }],
                status: "confirmed",
              },
              {
                vendor: { _id: strangerStore },
                subtotal: 975,
                items: [{ name: "Theirs" }],
                status: "shipped",
              },
            ],
          },
        ],
      }),
    };
  };
});
after(() => {
  User.findById = originals.user;
  Vendor.findOne = originals.vendor;
  Order.find = originals.order;
});
test("health and missing routes use consistent responses", async () => {
  assert.equal((await request(app).get("/api/health")).status, 200);
  const response = await request(app).get("/api/unknown");
  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});
test("registration validation rejects malformed input", async () => {
  const response = await request(app).post("/api/users").send({ email: "invalid", password: "x" });
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});
test("protected admin route rejects missing and customer tokens", async () => {
  assert.equal((await request(app).get("/api/admin/orders")).status, 401);
  assert.equal(
    (
      await request(app)
        .get("/api/admin/orders")
        .set("Authorization", `Bearer ${token(customerId)}`)
    ).status,
    403
  );
});
test("vendor route returns only the authorized seller group", async () => {
  const response = await request(app)
    .get("/api/orders/vendor/mine")
    .set("Authorization", `Bearer ${token(vendorId)}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.data[0].items.length, 1);
  assert.equal(response.body.data[0].totalAmount, 25);
  assert.equal(response.body.data[0].vendorOrders.length, 1);
});
test("product routes reject unauthorized creation", async () => {
  assert.equal((await request(app).post("/api/products").send({ name: "test" })).status, 401);
  assert.equal(
    (
      await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token(customerId)}`)
        .send({ name: "test" })
    ).status,
    403
  );
});
