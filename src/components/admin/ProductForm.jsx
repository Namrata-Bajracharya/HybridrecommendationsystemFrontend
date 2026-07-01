import { useState, useEffect } from "react";
import { privateAgent, publicAgent } from "../../Requests/AuthRequests";
import { CategoryAPI, ProductAPI, HOST_URL } from "../../routes/Routes";
import DraggableUpload from "../DraggableUpload";

export default function ProductForm({ editProduct, onDone }) {
  const [categories, setCategories] = useState([]);
  const [rootId, setRootId] = useState("");
  const [subId, setSubId] = useState("");
  const [fieldValues, setFieldValues] = useState({});
  const [catLoaded, setCatLoaded] = useState(false);
  const [f, setF] = useState({
    name: editProduct?.name || "",
    price: editProduct?.price?.toString() || "",
    stock: editProduct?.stock_quantity?.toString() || editProduct?.stock?.toString() || "20",
  });
  const [existingImages, setExistingImages] = useState(
    editProduct?.images?.map((img) => ({
      id: img.id || img.document_id,
      document: img.document,
    })) || []
  );
  const [newImages, setNewImages] = useState([]);
  const [err, setErr] = useState("");

  // auto-discovered fields for the selected sub-category
  const [typeField, setTypeField] = useState(null);
  const [originField, setOriginField] = useState(null);
  const [designField, setDesignField] = useState(null);
  const [patternField, setPatternField] = useState(null);

  useEffect(() => {
    publicAgent
      .get(CategoryAPI({}).getAll)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          if (editProduct) {
            const catName = editProduct.category?.name || editProduct.category;
            const sub = data.find((c) => c.name === catName || c.id === editProduct.category_id);
            const root = sub ? data.find((p) => p.id === sub.parent_id) : null;
            if (root) setRootId(String(root.id));
            if (sub) setSubId(String(sub.id));
          }
        }
      })
      .catch(() => {})
      .finally(() => setCatLoaded(true));
  }, []);

  const roots = categories.filter((c) => !c.parent_id);
  const subs = rootId
    ? categories.filter((c) => c.parent_id === Number(rootId))
    : [];
  const activeSub = subId
    ? categories.find((c) => c.id === Number(subId))
    : null;
  const fields = activeSub?.fields || [];

  // auto-discover fields when sub-category changes
  useEffect(() => {
    if (!activeSub?.fields) {
      setTypeField(null);
      setOriginField(null);
      setDesignField(null);
      setPatternField(null);
      return;
    }
    const tf = fields.find(
      (f) => !f.name.startsWith("origin_") && !f.name.startsWith("design_"),
    );
    setTypeField(tf || null);
  }, [subId]);

  useEffect(() => {
    if (!typeField) {
      setOriginField(null);
      return;
    }
    const of = fields.find(
      (f) =>
        f.name.startsWith("origin_") && f.belongs_to_type === typeField.name,
    );
    setOriginField(of || null);
  }, [typeField]);

  useEffect(() => {
    if (!originField || !typeField) {
      setDesignField(null);
      setPatternField(null);
      return;
    }
    const df = fields.find(
      (f) =>
        f.name.startsWith("design_") &&
        !f.name.startsWith("design_pattern_") &&
        f.belongs_to_type === typeField.name &&
        f.belongs_to_origin === originField.name,
    );
    const pf = fields.find(
      (f) =>
        f.name.startsWith("design_pattern_") &&
        f.belongs_to_type === typeField.name &&
        f.belongs_to_origin === originField.name,
    );
    setDesignField(df || null);
    setPatternField(pf || null);
  }, [originField]);

  useEffect(() => {
    if (
      editProduct &&
      activeSub?.fields &&
      Object.keys(fieldValues).length === 0
    ) {
      const vals = {};
      if (editProduct.field_values) {
        Object.assign(vals, editProduct.field_values);
      } else {
        activeSub.fields.forEach((fd) => {
          vals[fd.name] = editProduct[fd.name] || "";
        });
      }
      setFieldValues(vals);
    }
  }, [subId, editProduct]);

  const setFV = (name, val) => setFieldValues((p) => ({ ...p, [name]: val }));

  const handleImageUpload = (files) => {
    if (files.length === 0) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(f);
          }),
      ),
    ).then((results) => {
      setNewImages((p) => [...p, ...results]);
    });
  };

  const removeExisting = (id) =>
    setExistingImages((p) => p.filter((img) => img.id !== id));

  const removeNew = (idx) =>
    setNewImages((p) => p.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!f.name.trim() || !f.price) return setErr("Name and price required");
    const sub = categories.find((c) => c.id === Number(subId));
    if (!sub) return setErr("Select a sub-category");

    const payload = {
      name: f.name.trim(),
      price: Number(f.price),
      stock_quantity: Number(f.stock) || 20,
      category_id: Number(subId),
      field_values: { ...fieldValues },
    };

    if (editProduct) {
      const docIds = existingImages.map((img) => img.id);
      payload.image_document_ids = docIds;
      payload.image_data_urls = newImages;
    } else {
      payload.image_data_urls = newImages;
    }

    try {
      if (editProduct) {
        await privateAgent.put(ProductAPI({ id: editProduct.id }).update, payload);
      } else {
        await privateAgent.post(ProductAPI({}).create, payload);
      }
      onDone();
    } catch (err) {
      setErr(err?.response?.data?.detail || "Failed to save product");
    }
  };

  if (!catLoaded) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-6 mb-6 space-y-3"
    >
      {err && <p className="text-xs text-red-500">{err}</p>}
      <p className="text-sm font-medium text-dark">
        {editProduct ? "Edit Product" : "New Product"}
      </p>

      <input
        placeholder="Name"
        value={f.name}
        onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))}
        className="w-full px-3 py-2 rounded-xl bg-cream text-sm"
      />

      <div className="grid grid-cols-3 gap-3">
        <select
          value={rootId}
          onChange={(e) => {
            setRootId(e.target.value);
            setSubId("");
            setFieldValues({});
          }}
          className="px-3 py-2 rounded-xl bg-cream text-sm"
        >
          <option value="">— Select category —</option>
          {roots.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={subId}
          onChange={(e) => {
            setSubId(e.target.value);
            setFieldValues({});
          }}
          disabled={!rootId}
          className="px-3 py-2 rounded-xl bg-cream text-sm disabled:opacity-40"
        >
          <option value="">— Select sub-category —</option>
          {subs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {typeField && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted/60 uppercase tracking-wide block">
              {typeField.label || "Type"}
            </label>
            <FieldInput
              field={typeField}
              value={fieldValues[typeField.name] || ""}
              onChange={(v) => setFV(typeField.name, v)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {originField && (
          <div className="space-y-1">
            <label className="text-[10px] text-accent/60 uppercase tracking-wide block">
              {originField.label || "Origin"}
            </label>
            <FieldInput
              field={originField}
              value={fieldValues[originField.name] || ""}
              onChange={(v) => setFV(originField.name, v)}
            />
          </div>
        )}

        {designField && (
          <div className="space-y-1">
            <label className="text-[10px] text-dark/40 uppercase tracking-wide block">
              {designField.label || "Design"}
            </label>
            <FieldInput
              field={designField}
              value={fieldValues[designField.name] || ""}
              onChange={(v) => setFV(designField.name, v)}
            />
          </div>
        )}

        {patternField && (
          <div className="space-y-1">
            <label className="text-[10px] text-dark/40 uppercase tracking-wide block">
              {patternField.label || "Pattern"}
            </label>
            <FieldInput
              field={patternField}
              value={fieldValues[patternField.name] || ""}
              onChange={(v) => setFV(patternField.name, v)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Price (Rs)"
          type="number"
          value={f.price}
          onChange={(e) => setF((p) => ({ ...p, price: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl bg-cream text-sm"
        />

        <input
          placeholder="Stock"
          type="number"
          min="0"
          value={f.stock}
          onChange={(e) => setF((p) => ({ ...p, stock: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl bg-cream text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted/60 uppercase tracking-wide">Images</label>
        <div className="flex flex-wrap gap-2">
          {existingImages.map((img) => {
            const u = img.document
              ? `${HOST_URL}/${img.document.relative_path}`.replace(/\\/g, '/')
              : null
            return (
              <div key={img.id} className="relative w-16 h-16 rounded-xl overflow-hidden bg-cream group">
                {u ? <img src={u} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-cream" />}
                <button type="button" onClick={() => removeExisting(img.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition">x</button>
              </div>
            )
          })}
          {newImages.map((url, i) => (
            <div key={`new-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden bg-cream group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeNew(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition">x</button>
            </div>
          ))}
          <DraggableUpload
            label=""
            onFilesChange={handleImageUpload}
            maxFiles={10}
          />
        </div>
      </div>

      <button
        type="submit"
        className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
      >
        {editProduct ? "Update" : "Save"}
      </button>
    </form>
  );
}

function FieldInput({ field, value, onChange }) {
  return field.type === "select" ? (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-cream text-sm"
    >
      <option value="">Select {field.label || field.name}</option>
      {(Array.isArray(field.options) ? field.options : []).map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  ) : (
    <input
      placeholder={field.label || field.name}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-cream text-sm"
    />
  );
}
