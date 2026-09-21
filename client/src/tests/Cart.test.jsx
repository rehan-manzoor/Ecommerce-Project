import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";

import Cart from "../pages/Cart";

const mocks = vi.hoisted(() => ({
  user: null,

  navigate: vi.fn(),

  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),

  getGuestCart: vi.fn(),
  setGuestCart: vi.fn(),
  clearGuestCart: vi.fn(),

  notify: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mocks.user,
  }),
}));

vi.mock("../api/axios", () => ({
  default: {
    get: mocks.apiGet,
    put: mocks.apiPut,
    delete: mocks.apiDelete,
  },
}));

vi.mock("../utils/guestCart", () => ({
  getGuestCart: mocks.getGuestCart,
  setGuestCart: mocks.setGuestCart,
  clearGuestCart: mocks.clearGuestCart,
}));

vi.mock("../components/Toast", () => ({
  notify: mocks.notify,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

const product = {
  _id: "product-1",
  name: "Test Product",
  price: 25,
  salePrice: null,
  stock: 10,
  images: ["https://example.com/product.jpg"],
  variants: [],
};

const renderCart = () =>
  render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
});

describe("Cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.user = null;

    mocks.getGuestCart.mockReturnValue([]);

    mocks.apiGet.mockResolvedValue({
      data: {
        data: {
          items: [],
        },
      },
    });

    mocks.apiPut.mockResolvedValue({
      data: {
        data: {
          items: [],
        },
      },
    });

    mocks.apiDelete.mockResolvedValue({
      data: {
        data: {
          items: [],
        },
      },
    });
  });

  it("shows an empty-cart message for a guest with no items", async () => {
    mocks.user = null;
    mocks.getGuestCart.mockReturnValue([]);

    renderCart();

    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Browse products" })).toHaveAttribute(
      "href",
      "/products"
    );
  });

  it("loads and displays a guest cart", async () => {
    mocks.user = null;

    mocks.getGuestCart.mockReturnValue([
      {
        product,
        quantity: 2,
        variantId: null,
      },
    ]);

    renderCart();

    expect(
      await screen.findByRole("heading", {
        name: "Test Product",
      })
    ).toBeInTheDocument();

    expect(screen.getByText("$25.00 each")).toBeInTheDocument();

    expect(screen.getAllByText("$50.00")).toHaveLength(3);

    expect(
      screen.getByRole("button", {
        name: "Login to checkout",
      })
    ).toBeInTheDocument();
  });

  it("updates quantity for a guest cart", async () => {
    const item = {
      product,
      quantity: 1,
      variantId: null,
    };

    mocks.user = null;
    mocks.getGuestCart.mockReturnValue([item]);

    renderCart();

    await screen.findByText("Test Product");

    fireEvent.click(
      screen.getByRole("button", {
        name: "+",
      })
    );

    await waitFor(() => {
      expect(mocks.setGuestCart).toHaveBeenCalledWith([
        {
          product,
          quantity: 2,
          variantId: null,
        },
      ]);
    });
  });

  it("removes a product from a guest cart", async () => {
    const item = {
      product,
      quantity: 1,
      variantId: null,
    };

    mocks.user = null;
    mocks.getGuestCart.mockReturnValue([item]);

    renderCart();

    await screen.findByText("Test Product");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove",
      })
    );

    await waitFor(() => {
      expect(mocks.setGuestCart).toHaveBeenCalledWith([]);
    });

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("clears a guest cart", async () => {
    mocks.user = null;

    mocks.getGuestCart.mockReturnValue([
      {
        product,
        quantity: 1,
        variantId: null,
      },
    ]);

    renderCart();

    await screen.findByText("Test Product");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear cart",
      })
    );

    expect(mocks.clearGuestCart).toHaveBeenCalledTimes(1);

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("loads cart data from the API for a logged-in user", async () => {
    mocks.user = {
      id: "user-1",
      name: "Test User",
    };

    mocks.apiGet.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              product,
              quantity: 2,
              variantId: null,
            },
          ],
        },
      },
    });

    renderCart();

    await waitFor(() => {
      expect(mocks.apiGet).toHaveBeenCalledWith("/cart");
    });

    expect(await screen.findByText("Test Product")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Proceed to checkout",
      })
    ).toBeInTheDocument();
  });

  it("updates a logged-in user's cart through the API", async () => {
    mocks.user = {
      id: "user-1",
    };

    mocks.apiGet.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              product,
              quantity: 1,
              variantId: null,
            },
          ],
        },
      },
    });

    mocks.apiPut.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              product,
              quantity: 2,
              variantId: null,
            },
          ],
        },
      },
    });

    renderCart();

    await screen.findByText("Test Product");

    fireEvent.click(
      screen.getByRole("button", {
        name: "+",
      })
    );

    await waitFor(() => {
      expect(mocks.apiPut).toHaveBeenCalledWith("/cart/update", {
        productId: "product-1",
        quantity: 2,
        variantId: null,
      });
    });

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("removes a logged-in user's product through the API", async () => {
    mocks.user = {
      id: "user-1",
    };

    mocks.apiGet.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              product,
              quantity: 1,
              variantId: null,
            },
          ],
        },
      },
    });

    mocks.apiDelete.mockResolvedValue({
      data: {
        data: {
          items: [],
        },
      },
    });

    renderCart();

    await screen.findByText("Test Product");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove",
      })
    );

    await waitFor(() => {
      expect(mocks.apiDelete).toHaveBeenCalledWith("/cart/remove/product-1");
    });

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("sends a logged-in user to checkout", async () => {
    mocks.user = {
      id: "user-1",
    };

    mocks.apiGet.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              product,
              quantity: 1,
              variantId: null,
            },
          ],
        },
      },
    });

    renderCart();

    await screen.findByText("Test Product");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Proceed to checkout",
      })
    );

    expect(mocks.navigate).toHaveBeenCalledWith("/checkout");
  });

  it("sends a guest to login before checkout", async () => {
    mocks.user = null;

    mocks.getGuestCart.mockReturnValue([
      {
        product,
        quantity: 1,
        variantId: null,
      },
    ]);

    renderCart();

    await screen.findByText("Test Product");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Login to checkout",
      })
    );

    expect(mocks.navigate).toHaveBeenCalledWith("/login", {
      state: {
        from: "/checkout",
      },
    });
  });
});
