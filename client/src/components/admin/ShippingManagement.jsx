import { useState } from "react";
import api from "../../api/axios";
import { notify } from "../Toast";
import { money } from "./shared.js";

export function ShippingManagement({ methods, onChange }) {
  const [form, setForm] = useState({
    name: "",
    fee: 0,
    estimatedDays: 3,
  });

  const save = async (event) => {
    event.preventDefault();

    try {
      await api.post("/shipping", {
        ...form,
        fee: Number(form.fee),
        estimatedDays: Number(form.estimatedDays),
      });

      notify("Shipping method added");

      setForm({
        name: "",
        fee: 0,
        estimatedDays: 3,
      });

      await onChange();
    } catch (error) {
      notify(error.response?.data?.message || "Unable to save", "error");
    }
  };

  const toggle = async (method) => {
    try {
      await api.put(`/shipping/${method._id}`, {
        active: !method.active,
      });

      await onChange();
    } catch {
      notify("Unable to change method", "error");
    }
  };

  return (
    <>
      <div className="page-title">
        <h1>Shipping methods</h1>
      </div>

      <form className="panel inline-admin-form" onSubmit={save}>
        <input
          required
          placeholder="Method name"
          value={form.name}
          onChange={(event) =>
            setForm({
              ...form,
              name: event.target.value,
            })
          }
        />

        <input
          required
          type="number"
          min="0"
          step="0.01"
          value={form.fee}
          onChange={(event) =>
            setForm({
              ...form,
              fee: event.target.value,
            })
          }
        />

        <input
          required
          type="number"
          min="1"
          value={form.estimatedDays}
          onChange={(event) =>
            setForm({
              ...form,
              estimatedDays: event.target.value,
            })
          }
        />

        <button className="button">Add method</button>
      </form>

      <div className="management-list">
        {methods.map((method) => (
          <article className="management-card panel" key={method._id}>
            <span>
              {method.name} · {money(method.fee)} · {method.estimatedDays} days ·{" "}
              {method.active ? "Active" : "Inactive"}
            </span>

            <button className="button ghost small" onClick={() => toggle(method)}>
              {method.active ? "Disable" : "Enable"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
