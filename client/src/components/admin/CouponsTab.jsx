
export function CouponsTab({
  coupons,
  form,
  setForm,
  editingCouponId,
  onSave,
  onCancelEdit,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  return (
    <>
      <div className="page-title">
        <h1>Coupons</h1>
        <p>
          Create and manage marketplace-wide discount codes.
        </p>
      </div>

      <form
        className="panel inline-admin-form coupon-form"
        onSubmit={onSave}
      >
        <input
          required
          placeholder="CODE"
          value={form.code}
          onChange={(event) =>
            setForm({
              ...form,
              code: event.target.value.toUpperCase(),
            })
          }
        />

        <select
          value={form.discountType}
          onChange={(event) =>
            setForm({
              ...form,
              discountType: event.target.value,
            })
          }
        >
          <option value="percentage">
            Percentage
          </option>

          <option value="fixed">
            Fixed
          </option>
        </select>

        <input
          required
          type="number"
          min="0"
          value={form.discountValue}
          onChange={(event) =>
            setForm({
              ...form,
              discountValue: Number(event.target.value),
            })
          }
        />

        <input
          type="number"
          min="0"
          value={form.minPurchaseAmount}
          onChange={(event) =>
            setForm({
              ...form,
              minPurchaseAmount: Number(event.target.value),
            })
          }
        />

        <input
          required
          type="date"
          value={form.expiresAt}
          onChange={(event) =>
            setForm({
              ...form,
              expiresAt: event.target.value,
            })
          }
        />

        <select
          value={form.active ? "active" : "inactive"}
          onChange={(event) =>
            setForm({
              ...form,
              active: event.target.value === "active",
            })
          }
        >
          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

        <button className="button">
          {editingCouponId
            ? "Save changes"
            : "Create coupon"}
        </button>

        {editingCouponId && (
          <button
            type="button"
            className="button ghost"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Discount</th>
              <th>Min purchase</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon._id}>
                <td>
                  <strong>{coupon.code}</strong>
                </td>

                <td>{coupon.discountType}</td>

                <td>
                  {coupon.discountValue}
                  {coupon.discountType === "percentage"
                    ? "%"
                    : " USD"}
                </td>

                <td>
                  ${coupon.minPurchaseAmount || 0}
                </td>

                <td>
                  {new Date(
                    coupon.expiresAt
                  ).toLocaleDateString()}
                </td>

                <td>
                  {coupon.active ? "Active" : "Inactive"}
                </td>

                <td>
                  <button
                    className="text-button"
                    onClick={() => onEdit(coupon)}
                  >
                    Edit
                  </button>{" "}

                  <button
                    className="text-button"
                    onClick={() => onToggleActive(coupon)}
                  >
                    {coupon.active ? "Disable" : "Enable"}
                  </button>{" "}

                  <button
                    className="text-button danger"
                    onClick={() => onDelete(coupon)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
