import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router";

import Checkout from "../pages/Checkout";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("../api/axios", () => ({
  default: {
    get: mocks.apiGet,
    post: mocks.apiPost,
  },
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
  price: 100,
  salePrice: null,
  variants: [],
};

const cartResponse = {
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
};

const shippingResponse = {
  data: {
    data: [
      {
        _id: "shipping-1",
        name: "Standard Shipping",
        fee: 10,
        estimatedDays: 3,
      },
      {
        _id: "shipping-2",
        name: "Express Shipping",
        fee: 25,
        estimatedDays: 1,
      },
    ],
  },
};

const renderCheckout = () =>
  render(
    <MemoryRouter>
      <Checkout />
    </MemoryRouter>
  );

afterEach(() => {
  cleanup();
});

describe("Checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.apiGet.mockImplementation((url) => {
      if (url === "/cart") {
        return Promise.resolve(cartResponse);
      }

      if (url === "/shipping") {
        return Promise.resolve(shippingResponse);
      }

      return Promise.reject(new Error("Unexpected GET request"));
    });

    mocks.apiPost.mockResolvedValue({
      data: {
        data: {
          code: "SAVE20",
          discountAmount: 20,
        },
      },
    });
  });

  it("loads cart items and shipping methods", async () => {
    renderCheckout();

    expect(screen.getByText("Loading checkout...")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", {
        name: "Shipping details",
      })
    ).toBeInTheDocument();

    expect(screen.getByText("Test Product × 2")).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "Standard Shipping · $10.00 · 3 days",
      })
    ).toBeInTheDocument();

    expect(screen.getAllByText("$200.00")).toHaveLength(2);

    expect(screen.getByText("$210.00 + tax")).toBeInTheDocument();
  });

  it("redirects to cart when the cart is empty", async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === "/cart") {
        return Promise.resolve({
          data: {
            data: {
              items: [],
            },
          },
        });
      }

      if (url === "/shipping") {
        return Promise.resolve(shippingResponse);
      }

      return Promise.reject(new Error("Unexpected GET request"));
    });

    renderCheckout();

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/cart");
    });
  });

  it("redirects to login when cart loading fails", async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === "/cart") {
        return Promise.reject(new Error("Unauthorized"));
      }

      if (url === "/shipping") {
        return Promise.resolve(shippingResponse);
      }

      return Promise.reject(new Error("Unexpected GET request"));
    });

    renderCheckout();

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/login");
    });
  });

  it("applies a coupon successfully", async () => {
    renderCheckout();

    await screen.findByRole("heading", {
      name: "Shipping details",
    });

    fireEvent.change(screen.getByPlaceholderText("Coupon code"), {
      target: {
        value: "save20",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Apply",
      })
    );

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith("/coupons/validate", {
        code: "save20",
      });
    });

    expect(await screen.findByText("−$20.00")).toBeInTheDocument();

    expect(screen.getByText("$190.00 + tax")).toBeInTheDocument();

    expect(mocks.notify).toHaveBeenCalledWith("Coupon applied");
  });

  it("shows an error when coupon validation fails", async () => {
    mocks.apiPost.mockRejectedValue({
      response: {
        data: {
          message: "Coupon expired",
        },
      },
    });

    renderCheckout();

    await screen.findByRole("heading", {
      name: "Shipping details",
    });

    fireEvent.change(screen.getByPlaceholderText("Coupon code"), {
      target: {
        value: "OLDCOUPON",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Apply",
      })
    );

    await waitFor(() => {
      expect(mocks.notify).toHaveBeenCalledWith("Coupon expired", "error");
    });
  });

  it("changes the selected shipping method", async () => {
    renderCheckout();

    await screen.findByRole("heading", {
      name: "Shipping details",
    });

    fireEvent.change(screen.getByLabelText("Shipping method"), {
      target: {
        value: "shipping-2",
      },
    });

    expect(screen.getByText("$225.00 + tax")).toBeInTheDocument();
  });

  it("submits checkout details and navigates to payment", async () => {
    renderCheckout();

    await screen.findByRole("heading", {
      name: "Shipping details",
    });

    fireEvent.change(screen.getByLabelText("Street address"), {
      target: {
        value: "123 Main Road",
      },
    });

    fireEvent.change(screen.getByLabelText("City"), {
      target: {
        value: "Lahore",
      },
    });

    fireEvent.change(screen.getByLabelText("State / Province"), {
      target: {
        value: "Punjab",
      },
    });

    fireEvent.change(screen.getByLabelText("Postal code"), {
      target: {
        value: "54000",
      },
    });

    fireEvent.change(screen.getByLabelText("Country"), {
      target: {
        value: "Pakistan",
      },
    });

    fireEvent.change(screen.getByPlaceholderText("Coupon code"), {
      target: {
        value: "save20",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Apply",
      })
    );

    await screen.findByText("−$20.00");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Continue to secure payment",
      })
    );

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith("/payment", {
        state: {
          shippingAddress: {
            address: "123 Main Road",
            city: "Lahore",
            state: "Punjab",
            postalCode: "54000",
            country: "Pakistan",
          },
          couponCode: "SAVE20",
          shippingMethodId: "shipping-1",
          pricing: {
            subtotalAmount: 200,
            discountAmount: 20,
            shippingAmount: 10,
            taxAmount: 0,
            totalAmount: 190,
          },
        },
      });
    });
  });

  it("shows a shipping error if shipping methods cannot load", async () => {
    mocks.apiGet.mockImplementation((url) => {
      if (url === "/cart") {
        return Promise.resolve(cartResponse);
      }

      if (url === "/shipping") {
        return Promise.reject(new Error("Shipping unavailable"));
      }

      return Promise.reject(new Error("Unexpected GET request"));
    });

    renderCheckout();

    await waitFor(() => {
      expect(mocks.notify).toHaveBeenCalledWith("Shipping unavailable", "error");
    });
  });
});
