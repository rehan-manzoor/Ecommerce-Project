import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import { validateCoupon } from '../services/couponService.js';
const original = Coupon.findOne;
after(() => { Coupon.findOne = original; });
const a = new mongoose.Types.ObjectId();
const b = new mongoose.Types.ObjectId();
const vendor = new mongoose.Types.ObjectId();
const base = { code: 'SAVE', active: true, expiresAt: new Date(Date.now() + 86400000), discountType: 'percentage', discountValue: 20, minPurchaseAmount: 10, usageLimit: 3, usedCount: 0, products: [a], categories: [], vendors: [] };
test('coupon discounts only matching products', async () => {
  Coupon.findOne = async () => base;
  const result = await validateCoupon('save', 100, null, [{ product: { _id: a, vendor }, price: 20, quantity: 1 }, { product: { _id: b, vendor }, price: 80, quantity: 1 }]);
  assert.equal(result.discountAmount, 4);
});
test('coupon rejects expired and exhausted offers', async () => {
  Coupon.findOne = async () => ({ ...base, expiresAt: new Date(Date.now() - 1000) });
  await assert.rejects(validateCoupon('SAVE', 100), /not active/);
  Coupon.findOne = async () => ({ ...base, usedCount: 3 });
  await assert.rejects(validateCoupon('SAVE', 100), /usage limit/);
});
