import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import ShippingMethod from '../models/ShippingMethod.js';
import { selectedVariant } from '../services/catalogService.js';
import { getCartPricing } from '../services/pricingService.js';
const previous = { cart: Cart.findOne, shipping: ShippingMethod.findOne, exists: ShippingMethod.exists };
after(() => { Cart.findOne = previous.cart; ShippingMethod.findOne = previous.shipping; ShippingMethod.exists = previous.exists; });
test('variant selection rejects missing options and uses variant inventory', () => {
  const product = { name: 'Shirt', stock: 100, price: 20, variants: { length: 1, id: (id) => id === 'chosen' ? { _id: 'chosen', price: 25, stock: 2 } : null } };
  assert.throws(() => selectedVariant(product, null), /Select/);
  assert.equal(selectedVariant(product, 'chosen').price, 25);
  assert.equal(selectedVariant(product, 'chosen').stock, 2);
});
test('checkout calculates price, shipping and tax from server records', async () => {
  const variantId = new mongoose.Types.ObjectId();
  const product = { _id: new mongoose.Types.ObjectId(), name: 'Shirt', price: 20, stock: 100, status: 'active', approvalStatus: 'approved', variants: { length: 1, id: (id) => String(id) === String(variantId) ? { _id: variantId, price: 25, stock: 3 } : null } };
  Cart.findOne = () => ({ populate: async () => ({ items: [{ product, variantId, quantity: 2 }] }) });
  ShippingMethod.findOne = async () => ({ _id: 'method', fee: 4.5, active: true });
  ShippingMethod.exists = async () => true;
  process.env.TAX_RATE = '0.05';
  const pricing = await getCartPricing('user', '', 'method');
  assert.equal(pricing.subtotalAmount, 50);
  assert.equal(pricing.taxAmount, 2.5);
  assert.equal(pricing.shippingAmount, 4.5);
  assert.equal(pricing.totalAmount, 57);
});
test('checkout refuses variant overselling', async () => {
  const variantId = new mongoose.Types.ObjectId();
  const product = { _id: new mongoose.Types.ObjectId(), name: 'Shirt', status: 'active', approvalStatus: 'approved', variants: { length: 1, id: () => ({ _id: variantId, price: 25, stock: 1 }) } };
  Cart.findOne = () => ({ populate: async () => ({ items: [{ product, variantId, quantity: 2 }] }) });
  await assert.rejects(getCartPricing('user'), /Not enough stock/);
});
