import { useState, useEffect, useRef } from "react";
import { useSnackbar } from "notistack";
import { privateAgent, publicAgent } from "../../Requests/AuthRequests";
import { CategoryAPI, ProductAPI, VariantAPI, HOST_URL } from "../../routes/Routes";
import DraggableUpload from "../DraggableUpload";

export default function ProductForm({ editProduct, onDone }) {
  const { enqueueSnackbar } = useSnackbar();
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

  const [typeField, setTypeField] = useState(null);
  const [originField, setOriginField] = useState(null);
  const [designField, setDesignField] = useState(null);
  const [patternField, setPatternField] = useState(null);

  // ── Variant state ──
  const [variantDims, setVariantDims] = useState([]);
  const [variants, setVariants] = useState([]);
  const [variantImages, setVariantImages] = useState({});
  const skipAutoGen = useRef(false);
  const [useCustomPricing, setUseCustomPricing] = useState(false);

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

  // Load existing variants when editing
  useEffect(() => {
    if (editProduct?.variants?.length) {
      const hasAnyPrice = editProduct.variants.some(v => v.price != null && v.price !== 0);
      setUseCustomPricing(hasAnyPrice);
      skipAutoGen.current = true;
      const dims = [];
      const attrMap = {};
      editProduct.variants.forEach(v => {
        if (v.attributes && Array.isArray(v.attributes)) {
          v.attributes.forEach(a => {
            if (!attrMap[a.name]) attrMap[a.name] = new Set();
            attrMap[a.name].add(a.value);
          });
        }
      });
      Object.entries(attrMap).forEach(([name, vals]) => {
        dims.push({ name, options: [...vals] });
      });
      setVariantDims(dims);
      setVariants(editProduct.variants.map((v, i) => ({
        _tempId: `existing-${i}`,
        id: v.id,
        name: v.name,
        attributes: v.attributes || [],
        price: v.price != null ? String(v.price) : "",
        stock: String(v.stock_quantity),
        image_document_id: v.image_document_id || "",
        imageUrl: v.image_document_id ? null : null,
      })));
    }
  }, [editProduct]);

  const roots = categories.filter((c) => !c.parent_id);
  const subs = rootId
    ? categories.filter((c) => c.parent_id === Number(rootId))
    : [];
  const activeSub = subId
    ? categories.find((c) => c.id === Number(subId))
    : null;
  const fields = activeSub?.fields || [];

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
    if (!typeField) { setOriginField(null); return; }
    const of = fields.find((f) => f.name.startsWith("origin_") && f.belongs_to_type === typeField.name);
    setOriginField(of || null);
  }, [typeField]);

  useEffect(() => {
    if (!originField || !typeField) { setDesignField(null); setPatternField(null); return; }
    const df = fields.find((f) => f.name.startsWith("design_") && !f.name.startsWith("design_pattern_") && f.belongs_to_type === typeField.name && f.belongs_to_origin === originField.name);
    const pf = fields.find((f) => f.name.startsWith("design_pattern_") && f.belongs_to_type === typeField.name && f.belongs_to_origin === originField.name);
    setDesignField(df || null);
    setPatternField(pf || null);
  }, [originField]);

  useEffect(() => {
    if (editProduct && activeSub?.fields && Object.keys(fieldValues).length === 0) {
      const vals = {};
      if (editProduct.field_values) {
        Object.assign(vals, editProduct.field_values);
      } else {
        activeSub.fields.forEach((fd) => { vals[fd.name] = editProduct[fd.name] || ""; });
      }
      setFieldValues(vals);
    }
  }, [subId, editProduct]);

  const setFV = (name, val) => setFieldValues((p) => ({ ...p, [name]: val }));

  const handleImageUpload = (files) => {
    if (files.length === 0) { setNewImages([]); return; }
    Promise.all(files.map((f) => new Promise((resolve) => { const r = new FileReader(); r.onload = (e) => resolve(e.target.result); r.readAsDataURL(f); })))
      .then((results) => setNewImages(results));
  };

  const removeExisting = (id) => setExistingImages((p) => p.filter((img) => img.id !== id));

  // ── Variant helpers ──
  const dimNames = variantDims.map(d => d.name).filter(Boolean);
  const hasColor = dimNames.includes("Color");
  const hasSize = dimNames.includes("Size");

  const addPreset = (preset) => {
    setVariantDims((p) => {
      const next = [...p];
      if ((preset === "Color" || preset === "Color+Size") && !next.some(d => d.name === "Color"))
        next.push({ name: "Color", options: [] });
      if ((preset === "Size" || preset === "Color+Size") && !next.some(d => d.name === "Size"))
        next.push({ name: "Size", options: [] });
      return next;
    });
    setVariants([]);
  };

  const removeDim = (idx) => {
    setVariantDims((p) => p.filter((_, i) => i !== idx));
    setVariants([]);
  };
  const updateDim = (idx, field, val) => {
    setVariantDims((p) => {
      const next = [...p];
      next[idx] = { ...next[idx], [field]: val };
      if (field === "name" && val === "Color" && !next.some(d => d.name === "Size")) {
        next.push({ name: "Size", options: [] });
      }
      return next;
    });
    generateVariants();
  };

  const generateVariants = () => {
    const valid = variantDims.filter(d => d.name && d.options.length > 0 && d.options.some(o => o.trim()));
    if (valid.length === 0) return;
    const combos = cartesian(valid.map(d =>
      d.options.map(o => ({ name: d.name, value: o.trim() })).filter(a => a.value)
    ));
    setVariants(combos.map((attrs, i) => ({
      _tempId: `gen-${i}`,
      name: attrs.map(a => a.value).join(" / "),
      attributes: attrs,
      price: "",
      stock: "10",
      image_document_id: "",
      imageUrl: null,
    })));
  };

  useEffect(() => {
    if (skipAutoGen.current) {
      skipAutoGen.current = false;
      return;
    }
    generateVariants();
  }, [variantDims.length]);

  const updateVariant = (tempId, field, val) => {
    const newVariants = variants.map(v => v._tempId === tempId ? { ...v, [field]: val } : v);
    setVariants(newVariants);
    if (field === "stock") {
      const total = newVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      const max = Number(f.stock) || 20;
      if (total > max) {
        enqueueSnackbar(`Total variant stock (${total}) exceeds product stock (${max})`, { variant: "warning", autoHideDuration: 4000 });
      }
    }
  };

  const handleVariantImage = (tempId, files) => {
    if (files.length === 0) return;
    const r = new FileReader();
    r.onload = (e) => setVariants((p) => p.map(v => v._tempId === tempId ? { ...v, imageUrl: e.target.result } : v));
    r.readAsDataURL(files[0]);
  };

  const removeVariantImg = (tempId) => setVariants((p) => p.map(v => v._tempId === tempId ? { ...v, imageUrl: null, image_document_id: "" } : v));

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
      let productId;
      if (editProduct) {
        await privateAgent.put(ProductAPI({ id: editProduct.id }).update, payload);
        productId = editProduct.id;
      } else {
        const { data } = await privateAgent.post(ProductAPI({}).create, payload);
        productId = data.id;
      }

      // Validate stock on submit
      const totalVariantStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      const maxStock = Number(f.stock) || 20;
      if (totalVariantStock > maxStock) {
        enqueueSnackbar(`Total variant stock (${totalVariantStock}) exceeds product stock (${maxStock})`, { variant: "error" });
        return;
      }

      // Submit variants if any
      const variantData = variants.filter(v => v.attributes.length > 0)
        .map(v => ({
          name: v.name,
          attributes: v.attributes,
          price: useCustomPricing ? (v.price ? Number(v.price) : null) : null,
          stock_quantity: Number(v.stock) || 0,
        }));
      if (variantData.length > 0) {
        if (editProduct) {
          // Delete existing variants first
          const existingIds = (editProduct.variants || []).map(v => v.id).filter(Boolean);
          await Promise.all(existingIds.map(id =>
            privateAgent.delete(VariantAPI({ variantId: id }).delete).catch(() => {}),
          ));
        }
        await privateAgent.post(
          VariantAPI({ productId }).bulkCreate,
          { variants: variantData },
        );
      }

      onDone();
    } catch (err) {
      setErr(err?.response?.data?.detail || "Failed to save product");
    }
  };

  if (!catLoaded) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 mb-6 space-y-3">
      {err && <p className="text-xs text-red-500">{err}</p>}
      <p className="text-sm font-medium text-dark">{editProduct ? "Edit Product" : "New Product"}</p>

      <input placeholder="Name" value={f.name}
        onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))}
        className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />

      <div className="grid grid-cols-3 gap-3">
        <select value={rootId} onChange={(e) => { setRootId(e.target.value); setSubId(""); setFieldValues({}); }}
          className="px-3 py-2 rounded-xl bg-cream text-sm">
          <option value="">— Select category —</option>
          {roots.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select value={subId} onChange={(e) => { setSubId(e.target.value); setFieldValues({}); }} disabled={!rootId}
          className="px-3 py-2 rounded-xl bg-cream text-sm disabled:opacity-40">
          <option value="">— Select sub-category —</option>
          {subs.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        {typeField && (
          <div className="space-y-1">
            <label className="text-[10px] text-muted/60 uppercase tracking-wide block">{typeField.label || "Type"}</label>
            <FieldInput field={typeField} value={fieldValues[typeField.name] || ""} onChange={(v) => setFV(typeField.name, v)} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {originField && (
          <div className="space-y-1">
            <label className="text-[10px] text-accent/60 uppercase tracking-wide block">{originField.label || "Origin"}</label>
            <FieldInput field={originField} value={fieldValues[originField.name] || ""} onChange={(v) => setFV(originField.name, v)} />
          </div>
        )}
        {designField && (
          <div className="space-y-1">
            <label className="text-[10px] text-dark/40 uppercase tracking-wide block">{designField.label || "Design"}</label>
            <FieldInput field={designField} value={fieldValues[designField.name] || ""} onChange={(v) => setFV(designField.name, v)} />
          </div>
        )}
        {patternField && (
          <div className="space-y-1">
            <label className="text-[10px] text-dark/40 uppercase tracking-wide block">{patternField.label || "Pattern"}</label>
            <FieldInput field={patternField} value={fieldValues[patternField.name] || ""} onChange={(v) => setFV(patternField.name, v)} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Price (Rs)" type="number" value={f.price}
          onChange={(e) => setF((p) => ({ ...p, price: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
        <input placeholder="Stock" type="number" min="0" value={f.stock}
          onChange={(e) => setF((p) => ({ ...p, stock: e.target.value }))}
          className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted/60 uppercase tracking-wide">Images</label>
        <div className="flex flex-wrap gap-2">
          {existingImages.map((img) => {
            const u = img.document ? `${HOST_URL}/${img.document.relative_path}`.replace(/\\/g, '/') : null;
            return (
              <div key={img.id} className="relative w-16 h-16 rounded-xl overflow-hidden bg-cream group">
                {u ? <img src={u} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-cream" />}
                <button type="button" onClick={() => removeExisting(img.id)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition">x</button>
              </div>
            );
          })}
          <DraggableUpload label="" onFilesChange={handleImageUpload} maxFiles={10} disabled={!rootId || !subId} />
        </div>
      </div>

      {/* ── Variants Section ── */}
      <div className="border-t border-cream-alt pt-4 mt-4 space-y-3">
        <p className="text-sm font-medium text-dark">Variants (Color / Size / Shape)</p>

        {variantDims.map((dim, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <select value={dim.name}
                onChange={(e) => updateDim(i, "name", e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-cream text-sm">
                <option value="">— Select attribute —</option>
                <option value="Color" disabled={hasColor && dim.name !== "Color"}>Color</option>
                <option value="Size" disabled={hasSize && dim.name !== "Size"}>Size</option>
              </select>
              {dim.name && (
                <input placeholder={`Comma-separated ${dim.name} options e.g. Red, Blue, Green`} value={dim.options.join(", ")}
                  onChange={(e) => updateDim(i, "options", e.target.value.split(",").map(s => s.trim()))}
                  className="w-full px-3 py-1.5 rounded-xl bg-cream text-sm" />
              )}
            </div>
            <button type="button" onClick={() => removeDim(i)}
              className="mt-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-400 text-xs hover:bg-red-100 transition">Remove</button>
          </div>
        ))}

        <div className="flex gap-2">
          {!hasColor && (
            <button type="button" onClick={() => addPreset("Color")}
              className="px-3 py-1.5 rounded-xl bg-cream text-sm text-muted hover:text-dark transition">
              + Color
            </button>
          )}
          {!hasSize && (
            <button type="button" onClick={() => addPreset("Size")}
              className="px-3 py-1.5 rounded-xl bg-cream text-sm text-muted hover:text-dark transition">
              + Size
            </button>
          )}
          {!hasColor && !hasSize && (
            <button type="button" onClick={() => addPreset("Color+Size")}
              className="px-3 py-1.5 rounded-xl bg-dark text-sm text-cream hover:opacity-90 transition">
              + Color+Size
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input type="checkbox" checked={useCustomPricing}
            onChange={(e) => setUseCustomPricing(e.target.checked)}
            className="rounded border-muted/30 accent-dark" />
          Custom pricing
        </label>

        {variants.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2 border border-cream-alt rounded-xl p-3">
            <p className="text-xs text-muted/60 uppercase tracking-wide">{variants.length} combinations</p>
            {variants.map((v) => (
              <div key={v._tempId} className="flex items-center gap-2 bg-cream/50 rounded-xl px-3 py-2">
                <span className="text-xs font-medium text-dark w-28 shrink-0 truncate" title={v.name}>{v.name}</span>
                {useCustomPricing && (
                  <input placeholder="Price" type="number" value={v.price}
                    onChange={(e) => updateVariant(v._tempId, "price", e.target.value)}
                    className="w-20 px-2 py-1 rounded-lg bg-white text-xs" />
                )}
                <input placeholder="Stock" type="number" value={v.stock}
                  onChange={(e) => updateVariant(v._tempId, "stock", e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg bg-white text-xs" />
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0">
                  {v.imageUrl ? (
                    <>
                      <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeVariantImg(v._tempId)}
                        className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 text-white text-[8px] leading-none flex items-center justify-center">x</button>
                    </>
                  ) : (
                    <label className="w-full h-full flex items-center justify-center cursor-pointer text-[10px] text-muted">
                      +
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVariantImage(v._tempId, e.target.files)} />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">
        {editProduct ? "Update" : "Save"}
      </button>
    </form>
  );
}

function FieldInput({ field, value, onChange }) {
  return field.type === "select" ? (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl bg-cream text-sm">
      <option value="">Select {field.label || field.name}</option>
      {(Array.isArray(field.options) ? field.options : []).map((o) => (<option key={o} value={o}>{o}</option>))}
    </select>
  ) : (
    <input placeholder={field.label || field.name} value={value || ""}
      onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
  );
}

function cartesian(arrays) {
  if (arrays.length === 0) return [];
  return arrays.reduce((acc, curr) => {
    const res = [];
    acc.forEach(a => curr.forEach(c => res.push([...a, c])));
    return res;
  }, [[]]);
}
