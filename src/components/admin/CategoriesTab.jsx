import { useState, useEffect, useCallback } from 'react'
import { privateAgent, publicAgent } from '../../Requests/AuthRequests'
import { CategoryAPI } from '../../routes/Routes'

const EMPTY_FIELD = { name: '', description: '', options: '', parent_id: '', sub_id: '', type_id: '', origin_id: '' }

function FieldSelectors({ form, setForm, flatCats }) {
  const subs = form.parent_id
    ? flatCats.filter(c => c.parent_id === Number(form.parent_id))
    : []

  const sub = form.sub_id ? flatCats.find(c => c.id === Number(form.sub_id)) : null
  const typeFields = sub?.fields?.filter(f => !f.name.startsWith('origin_') && !f.name.startsWith('design_')) || []
  const originFields = sub?.fields?.filter(f => f.name.startsWith('origin_')) || []

  const placeholders = {
    name: { '': 'Type name', origin_: 'Title', design_: 'Name' },
    options: { '': 'Options (comma-sep)', origin_: 'Type (comma-sep)', design_: 'Country (comma-sep)' },
  }
  const ph = (k) => placeholders[k][form._prefix] || ''

  return (
    <div className="space-y-3">
      <input placeholder={ph('name')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
      <input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
      <input placeholder={ph('options')} value={form.options} onChange={e => setForm(p => ({ ...p, options: e.target.value }))}
        className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
      <select value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value, sub_id: '', type_id: '', origin_id: '' }))}
        className="w-full px-3 py-2 rounded-xl bg-cream text-sm">
        <option value="">— Select category —</option>
        {flatCats.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={form.sub_id} onChange={e => setForm(p => ({ ...p, sub_id: e.target.value, type_id: '', origin_id: '' }))}
        disabled={!form.parent_id}
        className="w-full px-3 py-2 rounded-xl bg-cream text-sm disabled:opacity-40">
        <option value="">— Select sub-category —</option>
        {subs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {(form._prefix === 'origin_' || form._prefix === 'design_' || form._prefix === 'design_pattern_') && (
        <select value={form.type_id} onChange={e => setForm(p => ({ ...p, type_id: e.target.value, origin_id: '' }))}
          disabled={!form.sub_id}
          className="w-full px-3 py-2 rounded-xl bg-cream text-sm disabled:opacity-40">
          <option value="">— Select type —</option>
          {typeFields.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
        </select>
      )}
      {(form._prefix === 'design_' || form._prefix === 'design_pattern_') && (
        <select value={form.origin_id} onChange={e => setForm(p => ({ ...p, origin_id: e.target.value }))}
          disabled={!form.type_id}
          className="w-full px-3 py-2 rounded-xl bg-cream text-sm disabled:opacity-40">
          <option value="">— Select origin —</option>
          {originFields.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
        </select>
      )}
    </div>
  )
}

function FieldEditForm({ field, subId, idx, onSave, onCancel }) {
  const [label, setLabel] = useState(field.label || '')
  const [desc, setDesc] = useState(field.description || '')
  const [opts, setOpts] = useState((field.options || []).join(', '))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(subId, idx, { ...field, label: label.trim(), description: desc.trim(), options: opts.split(',').map(s => s.trim()).filter(Boolean) })
    setSaving(false)
  }

  return (
    <div className="bg-cream rounded-xl p-3 mt-1 space-y-2 border border-dark/10" style={{ marginLeft: 40 }}>
      <p className="text-xs font-medium text-dark/60 uppercase tracking-wide">Edit {field.name}</p>
      <input placeholder="Label" value={label} onChange={e => setLabel(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-white text-sm" />
      <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-white text-sm" />
      <input placeholder="Options (comma-separated)" value={opts} onChange={e => setOpts(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-white text-sm" />
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving || !label.trim()}
          className="px-4 py-1.5 rounded-lg bg-dark text-cream text-xs font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        <button onClick={onCancel} className="px-4 py-1.5 rounded-lg border text-xs text-muted">Cancel</button>
      </div>
    </div>
  )
}

export default function CategoriesTab() {
  const [rootCats, setRootCats] = useState([])
  const [flatCats, setFlatCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', description: '' })

  const [showSubForm, setShowSubForm] = useState(false)
  const [subForm, setSubForm] = useState({ name: '', description: '', parent_id: '' })

  const [showTypeForm, setShowTypeForm] = useState(false)
  const [typeForm, setTypeForm] = useState({ ...EMPTY_FIELD, _prefix: '' })
  const [showOriginForm, setShowOriginForm] = useState(false)
  const [originForm, setOriginForm] = useState({ ...EMPTY_FIELD, _prefix: 'origin_' })
  const [showDesignForm, setShowDesignForm] = useState(false)
  const [designForm, setDesignForm] = useState({ ...EMPTY_FIELD, _prefix: 'design_' })
  const [showPatternForm, setShowPatternForm] = useState(false)
  const [patternForm, setPatternForm] = useState({ ...EMPTY_FIELD, _prefix: 'design_pattern_' })

  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', parent_id: '' })

  const [editingField, setEditingField] = useState(null)

  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [treeRes, flatRes] = await Promise.all([
        publicAgent.get(CategoryAPI({}).getTree),
        publicAgent.get(CategoryAPI({}).getAll),
      ])
      if (Array.isArray(treeRes.data)) setRootCats(treeRes.data)
      if (Array.isArray(flatRes.data)) setFlatCats(flatRes.data)
    } catch { setError('Failed to load categories') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const resetForms = () => {
    setShowCatForm(false); setShowSubForm(false)
    setShowTypeForm(false); setShowOriginForm(false); setShowDesignForm(false); setShowPatternForm(false)
    setEditId(null)
    setEditingField(null)
    setCatForm({ name: '', description: '' })
    setSubForm({ name: '', description: '', parent_id: '' })
    setTypeForm({ ...EMPTY_FIELD, _prefix: '' })
    setOriginForm({ ...EMPTY_FIELD, _prefix: 'origin_' })
    setDesignForm({ ...EMPTY_FIELD, _prefix: 'design_' })
    setPatternForm({ ...EMPTY_FIELD, _prefix: 'design_pattern_' })
    setEditForm({ name: '', description: '', parent_id: '' })
  }

  const openForm = (setter) => { resetForms(); setter(true) }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    if (!catForm.name.trim()) return
    setSaving(true)
    try {
      await privateAgent.post(CategoryAPI({}).create, { name: catForm.name.trim(), description: catForm.description.trim() || null })
      resetForms(); fetchAll()
    } catch (err) { alert(err?.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const handleSaveSub = async (e) => {
    e.preventDefault()
    if (!subForm.name.trim() || !subForm.parent_id) return
    setSaving(true)
    try {
      await privateAgent.post(CategoryAPI({}).create, {
        name: subForm.name.trim(), description: subForm.description.trim() || null,
        parent_id: Number(subForm.parent_id),
      })
      resetForms(); fetchAll()
    } catch (err) { alert(err?.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const saveField = async (form) => {
    if (!form.name.trim() || !form.sub_id) return alert('Fill required fields')
    if ((form._prefix === 'origin_' || form._prefix === 'design_' || form._prefix === 'design_pattern_') && !form.type_id) return alert('Select a type')
    if ((form._prefix === 'design_' || form._prefix === 'design_pattern_') && !form.origin_id) return alert('Select an origin')

    const sub = flatCats.find(c => c.id === Number(form.sub_id))
    if (!sub) return alert('Sub-category not found')

    const currentFields = sub.fields || []
    const nameKey = form.name.trim().toLowerCase().replace(/\s+/g, '_')
    const newField = {
      name: (form._prefix || '') + nameKey,
      label: form.name.trim(),
      type: 'select',
      options: form.options.split(',').map(s => s.trim()).filter(Boolean),
      description: form.description.trim() || '',
      required: false,
    }
    if (form.type_id) newField.belongs_to_type = form.type_id
    if (form.origin_id) newField.belongs_to_origin = form.origin_id

    setSaving(true)
    try {
      await privateAgent.put(CategoryAPI({ id: sub.id }).update, {
        fields: [...currentFields, newField],
      })
      resetForms(); fetchAll()
    } catch (err) { alert(err?.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const saveFieldEdit = async (subId, idx, updated) => {
    const sub = flatCats.find(c => c.id === subId)
    if (!sub || !sub.fields) return
    const fields = [...sub.fields]
    fields[idx] = updated
    try {
      await privateAgent.put(CategoryAPI({ id: subId }).update, { fields })
      setEditingField(null)
      fetchAll()
    } catch (err) { alert(err?.response?.data?.detail || 'Failed') }
  }

  const deleteField = async (subId, idx) => {
    const sub = flatCats.find(c => c.id === subId)
    if (!sub || !sub.fields) return
    const f = sub.fields[idx]
    if (!confirm(`Delete "${f.label || f.name}"?`)) return
    const fields = sub.fields.filter((_, i) => i !== idx)
    try {
      await privateAgent.put(CategoryAPI({ id: subId }).update, { fields: fields.length ? fields : null })
      fetchAll()
    } catch (err) { alert(err?.response?.data?.detail || 'Failed') }
  }

  const handleEdit = (cat) => {
    resetForms()
    setEditId(cat.id)
    setEditForm({
      name: cat.name, description: cat.description || '',
      parent_id: cat.parent_id || '',
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) return
    setSaving(true)
    try {
      const payload = { name: editForm.name.trim(), description: editForm.description.trim() || null }
      if (editForm.parent_id) payload.parent_id = Number(editForm.parent_id)
      await privateAgent.put(CategoryAPI({ id: editId }).update, payload)
      resetForms(); fetchAll()
    } catch (err) { alert(err?.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    const cat = flatCats.find(c => c.id === id)
    if (cat?.children?.length > 0 && !confirm(`"${cat.name}" has sub-categories. Delete anyway?`)) return
    if (!confirm(`Delete "${cat?.name}"?`)) return
    try { await privateAgent.delete(CategoryAPI({ id }).delete); fetchAll() }
    catch { alert('Failed to delete') }
  }

  if (loading) return <p className="text-sm text-muted">Loading...</p>

  return (
    <div>
      <p className="text-sm text-muted mb-4">{flatCats.length} categories</p>
      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      <div className="flex gap-3 mb-6 flex-wrap">
        <button className="px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
          onClick={() => showCatForm ? resetForms() : openForm(setShowCatForm)}>
          {showCatForm ? 'Cancel' : '+ Create Category'}
        </button>
        <button className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:opacity-90 transition"
          onClick={() => showSubForm ? resetForms() : openForm(setShowSubForm)}>
          {showSubForm ? 'Cancel' : '+ Create Sub-category'}
        </button>
        <button className="px-4 py-2 rounded-xl border-2 border-dark text-dark text-sm font-medium hover:bg-dark hover:text-cream transition"
          onClick={() => showTypeForm ? resetForms() : openForm(setShowTypeForm)}>
          {showTypeForm ? 'Cancel' : '+ Add Type'}
        </button>
        <button className="px-4 py-2 rounded-xl border-2 border-dark/40 text-dark text-sm font-medium hover:bg-dark hover:text-cream transition"
          onClick={() => showOriginForm ? resetForms() : openForm(setShowOriginForm)}>
          {showOriginForm ? 'Cancel' : '+ Add Origin'}
        </button>
        <button className="px-4 py-2 rounded-xl border-2 border-dark/40 text-dark text-sm font-medium hover:bg-dark hover:text-cream transition"
          onClick={() => showDesignForm ? resetForms() : openForm(setShowDesignForm)}>
          {showDesignForm ? 'Cancel' : '+ Add Design'}
        </button>
        <button className="px-4 py-2 rounded-xl border-2 border-dark/20 text-dark text-sm font-medium hover:bg-dark hover:text-cream transition"
          onClick={() => showPatternForm ? resetForms() : openForm(setShowPatternForm)}>
          {showPatternForm ? 'Cancel' : '+ Add Pattern'}
        </button>
      </div>

      {showCatForm && (
        <form onSubmit={handleSaveCategory} className="bg-white rounded-2xl p-6 mb-4 space-y-3">
          <p className="text-sm font-medium text-dark">New Category</p>
          <input placeholder="Name *" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
          <input placeholder="Description" value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
          <button type="submit" disabled={saving || !catForm.name.trim()}
            className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Category'}</button>
        </form>
      )}

      {showSubForm && (
        <form onSubmit={handleSaveSub} className="bg-white rounded-2xl p-6 mb-4 space-y-3">
          <p className="text-sm font-medium text-dark">New Sub-category</p>
          <input placeholder="Name *" value={subForm.name} onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
          <input placeholder="Description" value={subForm.description} onChange={e => setSubForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
          <select value={subForm.parent_id} onChange={e => setSubForm(p => ({ ...p, parent_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm">
            <option value="">— Select parent category —</option>
            {flatCats.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" disabled={saving || !subForm.name.trim() || !subForm.parent_id}
            className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Sub-category'}</button>
        </form>
      )}

      {showTypeForm && (
        <form onSubmit={e => { e.preventDefault(); saveField(typeForm) }} className="bg-white rounded-2xl p-6 mb-4 space-y-3 border-2 border-dashed border-dark/30">
          <p className="text-sm font-medium text-dark">New Type</p>
          <FieldSelectors form={typeForm} setForm={setTypeForm} flatCats={flatCats} />
          <button type="submit" disabled={saving || !typeForm.name.trim() || !typeForm.sub_id}
            className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Type'}</button>
        </form>
      )}

      {showOriginForm && (
        <form onSubmit={e => { e.preventDefault(); saveField(originForm) }} className="bg-white rounded-2xl p-6 mb-4 space-y-3 border-2 border-dashed border-dark/30">
          <p className="text-sm font-medium text-dark">New Origin</p>
          <FieldSelectors form={originForm} setForm={setOriginForm} flatCats={flatCats} />
          <button type="submit" disabled={saving || !originForm.name.trim() || !originForm.sub_id || !originForm.type_id}
            className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Origin'}</button>
        </form>
      )}

      {showDesignForm && (
        <form onSubmit={e => { e.preventDefault(); saveField(designForm) }} className="bg-white rounded-2xl p-6 mb-4 space-y-3 border-2 border-dashed border-dark/30">
          <p className="text-sm font-medium text-dark">New Design</p>
          <FieldSelectors form={designForm} setForm={setDesignForm} flatCats={flatCats} />
          <button type="submit" disabled={saving || !designForm.name.trim() || !designForm.sub_id || !designForm.type_id || !designForm.origin_id}
            className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Design'}</button>
        </form>
      )}

      {showPatternForm && (
        <form onSubmit={e => { e.preventDefault(); saveField(patternForm) }} className="bg-white rounded-2xl p-6 mb-4 space-y-3 border-2 border-dashed border-dark/20">
          <p className="text-sm font-medium text-dark">New Pattern</p>
          <FieldSelectors form={patternForm} setForm={setPatternForm} flatCats={flatCats} />
          <button type="submit" disabled={saving || !patternForm.name.trim() || !patternForm.sub_id || !patternForm.type_id || !patternForm.origin_id}
            className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Pattern'}</button>
        </form>
      )}

      {editId && (
        <form onSubmit={handleUpdate} className="bg-white rounded-2xl p-6 mb-4 space-y-3 border-2 border-accent/30">
          <p className="text-sm font-medium text-dark">Edit Category</p>
          <input placeholder="Name *" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
          <input placeholder="Description" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
          <select value={editForm.parent_id} onChange={e => setEditForm(p => ({ ...p, parent_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-cream text-sm">
            <option value="">— No parent (root) —</option>
            {flatCats.filter(c => c.id !== editId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !editForm.name.trim()}
              className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Update'}</button>
            <button type="button" className="px-4 py-2 rounded-xl border text-sm text-muted" onClick={resetForms}>Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-1">
        {rootCats.map(cat => <CategoryRow key={cat.id} cat={cat} parents={flatCats} onEdit={handleEdit} onDelete={handleDelete} onDeleteField={deleteField} onEditField={setEditingField} editingField={editingField} onSaveFieldEdit={saveFieldEdit} depth={0} />)}
        {rootCats.length === 0 && <p className="text-sm text-muted">No categories yet.</p>}
      </div>
    </div>
  )
}

function FieldItem({ f, idx, subId, depth, onEditField, editingField, onSaveFieldEdit, onDeleteField }) {
  const isEditing = editingField && editingField.subId === subId && editingField.idx === idx
  return (
    <>
      <div className="bg-white rounded-xl px-4 py-2 text-sm group" style={{ marginLeft: depth * 20 }}>
        <div className="flex items-center gap-2">
          <span className="text-dark font-medium">{f.label || f.name}</span>
          <span className="text-[10px] text-muted/60">({(f.options || []).join(', ')})</span>
          {f.belongs_to_type && <span className="text-[10px] text-accent/50">→{f.belongs_to_type.replace(/^(origin_|design_pattern_|design_)/, '')}</span>}
          {f.belongs_to_origin && <span className="text-[10px] text-accent/50">→{f.belongs_to_origin.replace(/^origin_/, '')}</span>}
          <div className="flex gap-2 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition">
            <button className="text-xs text-accent hover:underline" onClick={() => onEditField({ subId, idx })}>Edit</button>
            <button className="text-xs text-red-400 hover:text-red-500" onClick={() => onDeleteField(subId, idx)}>Delete</button>
          </div>
        </div>
      </div>
      {isEditing && (
        <FieldEditForm field={f} subId={subId} idx={idx} onSave={onSaveFieldEdit} onCancel={() => onEditField(null)} />
      )}
    </>
  )
}

function CategoryRow({ cat, parents, onEdit, onDelete, onDeleteField, onEditField, editingField, onSaveFieldEdit, depth }) {
  const parentName = cat.parent_id ? parents.find(c => c.id === cat.parent_id)?.name : null
  const fields = cat.fields || []

  const typeFields = fields.filter(f => !f.name.startsWith('origin_') && !f.name.startsWith('design_'))
  const originFields = fields.filter(f => f.name.startsWith('origin_'))
  const designFields = fields.filter(f => f.name.startsWith('design_') && !f.name.startsWith('design_pattern_'))
  const patternFields = fields.filter(f => f.name.startsWith('design_pattern_'))

  return (
    <>
      <div className="bg-white rounded-xl px-4 py-2.5 text-sm group" style={{ marginLeft: depth * 20 }}>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-dark font-medium">{cat.name}</span>
          {parentName && <span className="text-[11px] text-muted bg-cream px-2 py-0.5 rounded-full">sub of {parentName}</span>}
          {!parentName && cat.children?.length > 0 && <span className="text-[11px] text-muted bg-cream px-2 py-0.5 rounded-full">{cat.children.length} sub</span>}
          {typeFields.length > 0 && <span className="text-[11px] text-accent bg-cream px-2 py-0.5 rounded-full">{typeFields.length} types</span>}
          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition">
            <button className="text-xs text-accent hover:underline" onClick={() => onEdit(cat)}>Edit</button>
            <button className="text-xs text-red-400 hover:text-red-500" onClick={() => onDelete(cat.id)}>Delete</button>
          </div>
        </div>
      </div>

      {typeFields.length > 0 && (
        <div className="mt-1 space-y-1 mb-1">
          {typeFields.map((f, i) => {
            const globalIdx = fields.indexOf(f)
            const childOrigins = originFields.filter(o => o.belongs_to_type === f.name)
            return (
              <div key={f.name}>
                <FieldItem f={f} idx={globalIdx} subId={cat.id} depth={depth + 1}
                  onEditField={onEditField} editingField={editingField}
                  onSaveFieldEdit={onSaveFieldEdit} onDeleteField={onDeleteField} />
                {childOrigins.length > 0 && (
                  <div className="space-y-1 mt-1 mb-1">
                    {childOrigins.map((o, j) => {
                      const oIdx = fields.indexOf(o)
                      const childDesigns = designFields.filter(d => d.belongs_to_type === o.belongs_to_type && d.belongs_to_origin === o.name)
                      return (
                        <div key={o.name}>
                          <FieldItem f={o} idx={oIdx} subId={cat.id} depth={depth + 2}
                            onEditField={onEditField} editingField={editingField}
                            onSaveFieldEdit={onSaveFieldEdit} onDeleteField={onDeleteField} />
                          {childDesigns.length > 0 && (
                            <div className="space-y-1 mt-1 mb-1">
                              {childDesigns.map((d, k) => {
                                const dIdx = fields.indexOf(d)
                                const childPatterns = patternFields.filter(p => p.belongs_to_type === d.belongs_to_type && p.belongs_to_origin === d.belongs_to_origin)
                                return (
                                  <div key={d.name}>
                                    <FieldItem f={d} idx={dIdx} subId={cat.id} depth={depth + 3}
                                      onEditField={onEditField} editingField={editingField}
                                      onSaveFieldEdit={onSaveFieldEdit} onDeleteField={onDeleteField} />
                                    {childPatterns.length > 0 && (
                                      <div className="space-y-1 mt-1 mb-1">
                                        {childPatterns.map((p, l) => {
                                          const pIdx = fields.indexOf(p)
                                          return (
                                            <FieldItem key={p.name} f={p} idx={pIdx} subId={cat.id} depth={depth + 4}
                                              onEditField={onEditField} editingField={editingField}
                                              onSaveFieldEdit={onSaveFieldEdit} onDeleteField={onDeleteField} />
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {cat.children?.map(child => (
        <CategoryRow key={child.id} cat={child} parents={parents} onEdit={onEdit} onDelete={onDelete}
          onDeleteField={onDeleteField} onEditField={onEditField} editingField={editingField}
          onSaveFieldEdit={onSaveFieldEdit} depth={depth + 1} />
      ))}
    </>
  )
}
