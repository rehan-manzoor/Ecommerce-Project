
export function CategoriesTab({
  categories,
  form,
  setForm,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <div className="page-title">
        <h1>Categories</h1>
        <p>
          Organize the catalog vendors list products under.
        </p>
      </div>

      <form
        className="panel inline-admin-form"
        onSubmit={onCreate}
      >
        <input
          required
          placeholder="Category name"
          value={form.name}
          onChange={(event) =>
            setForm({
              ...form,
              name: event.target.value,
            })
          }
        />

        <input
          placeholder="Description"
          value={form.description}
          onChange={(event) =>
            setForm({
              ...form,
              description: event.target.value,
            })
          }
        />

        <select
          value={form.parentCategory}
          onChange={(event) =>
            setForm({
              ...form,
              parentCategory: event.target.value,
            })
          }
        >
          <option value="">
            No parent
          </option>

          {categories.map((category) => (
            <option
              key={category._id}
              value={category._id}
            >
              {category.name}
            </option>
          ))}
        </select>

        <button className="button">
          Create
        </button>
      </form>

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td>{category.name}</td>
                <td>{category.description}</td>
                <td>
                  {category.isActive ? "Active" : "Inactive"}
                </td>

                <td>
                  <button
                    className="text-button"
                    onClick={() => onEdit(category)}
                  >
                    Edit
                  </button>{" "}

                  <button
                    className="text-button danger"
                    onClick={() => onDelete(category)}
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
