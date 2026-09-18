import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * Replaces native window.prompt()/window.confirm() with an accessible,
 * on-brand modal. Usage:
 *
 *   const openDialog = useDialog();
 *   const result = await openDialog({
 *     title: "Delete product",
 *     description: "This can't be undone.",
 *     danger: true,
 *   });
 *   if (result) { ... } // simple confirm resolves to `true`
 *
 *   const result = await openDialog({
 *     title: "Edit category",
 *     fields: [{ name: "name", label: "Name", required: true }],
 *   });
 *   if (result) { ... result.name } // field dialogs resolve to the values object
 *
 * Cancelling (Escape, backdrop click, or the Cancel button) resolves to `null`.
 */
const DialogContext = createContext(null);

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [values, setValues] = useState({});
  const resolverRef = useRef(null);

  const openDialog = (config) =>
    new Promise((resolve) => {
      const initialValues = {};
      (config.fields || []).forEach((field) => {
        initialValues[field.name] = field.defaultValue ?? "";
      });
      resolverRef.current = resolve;
      setValues(initialValues);
      setDialog(config);
    });

  const close = (result) => {
    setDialog(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  useEffect(() => {
    if (!dialog) return;
    const onKeyDown = (e) => e.key === "Escape" && close(null);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  const submit = (e) => {
    e.preventDefault();
    close(dialog.fields?.length ? values : true);
  };

  return (
    <DialogContext.Provider value={openDialog}>
      {children}

      {dialog && (
        <div className="dialog-overlay" onMouseDown={(e) => e.target === e.currentTarget && close(null)}>
          <form
            className="dialog-card panel"
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <h3 id="dialog-title">{dialog.title}</h3>
            {dialog.description && <p className="muted">{dialog.description}</p>}

            {(dialog.fields || []).map((field, index) => (
              <label key={field.name}>
                {field.label}
                {field.type === "textarea" ? (
                  <textarea
                    autoFocus={index === 0}
                    required={field.required}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                ) : (
                  <input
                    autoFocus={index === 0}
                    required={field.required}
                    value={values[field.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                  />
                )}
              </label>
            ))}

            <div className="dialog-actions">
              <button type="button" className="button ghost" onClick={() => close(null)}>
                {dialog.cancelLabel || "Cancel"}
              </button>
              <button className={`button ${dialog.danger ? "danger" : ""}`} autoFocus={!dialog.fields?.length}>
                {dialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => useContext(DialogContext);
