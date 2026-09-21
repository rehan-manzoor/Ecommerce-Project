import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";

process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
process.env.JWT_ACCESS_SECRET = "local-test-secret";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.NODE_ENV = "test";

const [{ default: app }, { default: User }, { default: Order }, { default: ReturnRequest }] =
  await Promise.all([
    import("../app.js"),
    import("../models/User.js"),
    import("../models/Order.js"),
    import("../models/ReturnRequest.js"),
  ]);

const customerId = "68aa00000000000000000001";
const orderId = "68aa00000000000000000010";
const vendorId = "68aa00000000000000000020";
const productId = "68aa00000000000000000030";
const returnId = "68aa00000000000000000040";

const token = jwt.sign(
  {
    userId: customerId,
  },
  process.env.JWT_ACCESS_SECRET,
  {
    expiresIn: "1h",
  }
);

const originals = {
  userFindById: User.findById,
  orderFindOne: Order.findOne,
  returnCreate: ReturnRequest.create,
  returnFind: ReturnRequest.find,
};

let fakeOrder;
let createdReturn;

const makeDeliveredOrder = () => {
  const group = {
    vendor: vendorId,
    status: "delivered",
    deliveredAt: new Date(),
    history: [],
    items: [
      {
        product: productId,
        name: "Test Product",
        quantity: 2,
        price: 100,
      },
    ],
  };

  return {
    _id: orderId,
    user: customerId,
    vendorOrders: [group],

    save: async function () {
      return this;
    },
  };
};

before(() => {
  User.findById = (id) => ({
    select: async () => ({
      _id: {
        toString: () => String(id),
      },
      email: "customer@example.com",
      role: "customer",
      isBlocked: false,
    }),
  });
});

beforeEach(() => {
  fakeOrder = makeDeliveredOrder();
  createdReturn = null;

  Order.findOne = async (filter) => {
    if (String(filter._id) === orderId && String(filter.user) === customerId) {
      return fakeOrder;
    }

    return null;
  };

  ReturnRequest.create = async (data) => {
    createdReturn = {
      _id: returnId,
      status: "requested",
      ...data,
    };

    return createdReturn;
  };

  ReturnRequest.find = () => ({
    populate() {
      return this;
    },

    sort: async () => [],
  });
});

after(() => {
  User.findById = originals.userFindById;
  Order.findOne = originals.orderFindOne;
  ReturnRequest.create = originals.returnCreate;
  ReturnRequest.find = originals.returnFind;
});

test("return route rejects unauthenticated requests", async () => {
  const response = await request(app).post("/api/returns").send({
    orderId,
    productId,
    quantity: 1,
    reason: "Damaged item",
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test("customer can request a return for a delivered product", async () => {
  const response = await request(app)
    .post("/api/returns")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderId,
      productId,
      quantity: 1,
      reason: "Item arrived damaged",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);

  assert.ok(createdReturn);

  assert.equal(String(createdReturn.user), customerId);

  assert.equal(String(createdReturn.order), orderId);

  assert.equal(String(createdReturn.vendor), vendorId);

  assert.equal(String(createdReturn.product), productId);

  assert.equal(createdReturn.quantity, 1);

  assert.equal(createdReturn.reason, "Item arrived damaged");

  assert.equal(createdReturn.refundAmount, 100);

  assert.equal(fakeOrder.vendorOrders[0].status, "return_requested");

  assert.equal(fakeOrder.vendorOrders[0].history.at(-1).status, "return_requested");
});

test("return request calculates refund using requested quantity", async () => {
  const response = await request(app)
    .post("/api/returns")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderId,
      productId,
      quantity: 2,
      reason: "Both items are damaged",
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);

  assert.equal(createdReturn.quantity, 2);
  assert.equal(createdReturn.refundAmount, 200);
});

test("return request rejects quantity greater than purchased quantity", async () => {
  const response = await request(app)
    .post("/api/returns")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderId,
      productId,
      quantity: 3,
      reason: "Damaged item",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Quantity and reason are required");

  assert.equal(createdReturn, null);
});

test("return request rejects a missing or too-short reason", async () => {
  const response = await request(app)
    .post("/api/returns")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderId,
      productId,
      quantity: 1,
      reason: "x",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Quantity and reason are required");

  assert.equal(createdReturn, null);
});

test("return request rejects products that are not delivered", async () => {
  fakeOrder.vendorOrders[0].status = "shipped";

  const response = await request(app)
    .post("/api/returns")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderId,
      productId,
      quantity: 1,
      reason: "I want to return this",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Return window closed or item not delivered");

  assert.equal(createdReturn, null);
});

test("return request rejects products outside the 14 day return window", async () => {
  fakeOrder.vendorOrders[0].deliveredAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  const response = await request(app)
    .post("/api/returns")
    .set("Authorization", `Bearer ${token}`)
    .send({
      orderId,
      productId,
      quantity: 1,
      reason: "Item is damaged",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Return window closed or item not delivered");

  assert.equal(createdReturn, null);
});

test("customer can retrieve their own return requests", async () => {
  const response = await request(app)
    .get("/api/returns/my")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, []);
});
