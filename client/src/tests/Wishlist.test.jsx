import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Wishlist from "../pages/Wishlist";
import api from "../api/axios";
vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock("../components/Toast", () => ({ notify: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
test("saved products load and can be removed", async () => {
  api.get.mockResolvedValue({
    data: {
      data: [{ _id: "product-1", name: "Blue bag", price: 15, vendor: { storeName: "Maker" } }],
    },
  });
  api.delete.mockResolvedValue({ data: { data: [] } });
  render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );
  expect(await screen.findByText("Blue bag")).toBeTruthy();
  screen.getByRole("button", { name: "Remove" }).click();
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/wishlist/product-1"));
  expect(await screen.findByText(/Your wishlist is empty/)).toBeTruthy();
});
test("moving an item to cart sends server request before removing it", async () => {
  api.get.mockResolvedValue({
    data: { data: [{ _id: "product-1", name: "Blue bag", price: 15 }] },
  });
  api.post.mockResolvedValue({});
  api.delete.mockResolvedValue({ data: { data: [] } });
  render(
    <MemoryRouter>
      <Wishlist />
    </MemoryRouter>
  );
  await screen.findByText("Blue bag");
  screen.getByRole("button", { name: "Move to cart" }).click();
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/cart/add", { productId: "product-1", quantity: 1 })
  );
});
