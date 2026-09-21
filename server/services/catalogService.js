export const selectedVariant = (product, variantId) => {
  if (!product) throw new Error("Product unavailable");
  if (product.variants?.length) {
    const variant = product.variants.id(variantId);
    if (!variant) throw new Error("Select an available variant");
    return { variant, price: variant.price, stock: variant.stock };
  }
  if (variantId) throw new Error("This product has no variants");
  return { variant: null, price: product.salePrice ?? product.price, stock: product.stock };
};
export const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
