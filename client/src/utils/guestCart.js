const KEY = "mern_guest_cart";

export const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};
export const setGuestCart = (items) => localStorage.setItem(KEY, JSON.stringify(items));
export const clearGuestCart = () => localStorage.removeItem(KEY);
export const addGuestItem = (product, quantity = 1, variantId = null) => {
  const items = getGuestCart();
  const found = items.find(
    (item) => item.product._id === product._id && (item.variantId || null) === variantId
  );
  const stock = variantId
    ? product.variants?.find((variant) => variant._id === variantId)?.stock || 0
    : product.stock;
  if (found) found.quantity = Math.min(stock, found.quantity + quantity);
  else items.push({ product, variantId, quantity: Math.min(stock, quantity) });
  setGuestCart(items);
  window.dispatchEvent(new Event("guest-cart-updated"));
  return items;
};
