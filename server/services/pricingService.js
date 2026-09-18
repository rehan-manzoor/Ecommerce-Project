import Cart from '../models/Cart.js';
import ShippingMethod from '../models/ShippingMethod.js';
import { validateCoupon } from './couponService.js';
import { selectedVariant, money } from './catalogService.js';
export const getCartPricing = async (userId, couponCode = '', shippingMethodId = null) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart?.items.length) throw new Error('Cart is empty');
  const items = cart.items.map((entry) => {
    const product = entry.product;
    if (!product || product.status !== 'active' || product.approvalStatus !== 'approved') throw new Error('A product in your cart is unavailable');
    const choice = selectedVariant(product, entry.variantId);
    if (!Number.isInteger(entry.quantity) || entry.quantity < 1 || choice.stock < entry.quantity) throw new Error(`Not enough stock for ${product.name}`);
    return { product, variantId: choice.variant?._id || null, quantity: entry.quantity, price: choice.price };
  });
  const subtotalAmount = money(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const { coupon, discountAmount } = await validateCoupon(couponCode, subtotalAmount, userId, items);
  let shippingMethod = null;
  if (shippingMethodId) {
    shippingMethod = await ShippingMethod.findOne({ _id: shippingMethodId, active: true });
    if (!shippingMethod) throw new Error('Shipping method unavailable');
  } else if (await ShippingMethod.exists({ active: true })) throw new Error('Select a shipping method');
  const shippingAmount = shippingMethod?.fee || 0;
  const rate = Number(process.env.TAX_RATE || 0);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new Error('Invalid TAX_RATE configuration');
  const taxAmount = money((subtotalAmount - discountAmount) * rate);
  const totalAmount = money(subtotalAmount - discountAmount + shippingAmount + taxAmount);
  return { cart, items, subtotalAmount, discountAmount, shippingAmount, taxAmount, totalAmount, coupon, shippingMethod };
};
