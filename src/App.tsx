import { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toolbar } from 'primereact/toolbar';
import { PrimeReactProvider } from 'primereact/api';
import RuleEditor from './RuleEditor';
import JsonViewDialog from './JsonViewDialog';
import type { BusinessRule, RuleStatus } from './types';
import { initialRules, CATEGORIES } from './data';

const STATUS_SEVERITY: Record<RuleStatus, 'success' | 'secondary' | 'warning'> = {
  active: 'success',
  inactive: 'secondary',
  draft: 'warning',
};

export default function App() {
  const [rules, setRules] = useState<BusinessRule[]>(initialRules);
  const [selected, setSelected] = useState<BusinessRule[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | undefined>(undefined);
  const [jsonRule, setJsonRule] = useState<BusinessRule | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RuleStatus | null>(null);
  const toast = useRef<Toast>(null);

  const filtered = rules.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || r.category === filterCategory;
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const openNew = () => { setEditingRule(undefined); setEditorVisible(true); };
  const openEdit = (r: BusinessRule) => { setEditingRule(r); setEditorVisible(true); };

  const handleSave = (r: BusinessRule) => {
    setRules(prev => {
      const exists = prev.find(x => x.id === r.id);
      if (exists) return prev.map(x => x.id === r.id ? r : x);
      return [...prev, r];
    });
    toast.current?.show({ severity: 'success', summary: 'Saved', detail: `Rule "${r.name}" saved.`, life: 3000 });
    setEditorVisible(false);
  };

  const confirmDelete = (r: BusinessRule) => {
    confirmDialog({
      message: `Delete rule "${r.name}"? This cannot be undone.`,
      header: 'Delete Rule',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setRules(prev => prev.filter(x => x.id !== r.id));
        toast.current?.show({ severity: 'warn', summary: 'Deleted', detail: `Rule "${r.name}" removed.`, life: 3000 });
      },
    });
  };

  const toggleStatus = (r: BusinessRule) => {
    const next: RuleStatus = r.status === 'active' ? 'inactive' : 'active';
    setRules(prev => prev.map(x => x.id === r.id ? { ...x, status: next } : x));
    toast.current?.show({ severity: 'info', summary: 'Updated', detail: `Rule "${r.name}" is now ${next}.`, life: 2500 });
  };

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.status === 'active').length,
    draft: rules.filter(r => r.status === 'draft').length,
    triggers: rules.reduce((s, r) => s + r.triggerCount, 0),
  };

  /* ── Column templates ── */
  const nameBody = (r: BusinessRule) => (
    <div>
      <div className="font-semibold text-slate-800 text-sm">{r.name}</div>
      <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.description}</div>
    </div>
  );

  const statusBody = (r: BusinessRule) => (
    <Tag value={r.status.toUpperCase()} severity={STATUS_SEVERITY[r.status]} />
  );

  const categoryBody = (r: BusinessRule) => (
    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
      {r.category}
    </span>
  );

  const conditionsBody = (r: BusinessRule) => {
    const total = r.conditionGroups.reduce((s, g) => s + g.conditions.length, 0);
    return (
      <span className="mono text-xs text-slate-500">
        {r.conditionGroups.length} group{r.conditionGroups.length !== 1 ? 's' : ''}, {total} cond.
      </span>
    );
  };

  const actionsBody = (r: BusinessRule) => (
    <span className="mono text-xs text-slate-500">{r.actions.length} action{r.actions.length !== 1 ? 's' : ''}</span>
  );

  const triggersBody = (r: BusinessRule) => (
    <span className="mono text-sm font-medium text-slate-700">{r.triggerCount.toLocaleString()}</span>
  );

  const priorityBody = (r: BusinessRule) => (
    <span className="mono text-sm text-slate-600 font-semibold">{r.priority}</span>
  );

  const actionsColBody = (r: BusinessRule) => (
    <div className="flex gap-1">
      <Button icon="pi pi-pencil" size="small" text severity="info"
        tooltip="Edit" tooltipOptions={{ position: 'top' }} onClick={() => openEdit(r)} />
      <Button icon="pi pi-code" size="small" text severity="secondary"
        tooltip="View JSON" tooltipOptions={{ position: 'top' }} onClick={() => setJsonRule(r)} />
      <Button
        icon={r.status === 'active' ? 'pi pi-pause' : 'pi pi-play'}
        size="small" text
        severity={r.status === 'active' ? 'warning' : 'success'}
        tooltip={r.status === 'active' ? 'Deactivate' : 'Activate'}
        tooltipOptions={{ position: 'top' }}
        onClick={() => toggleStatus(r)} />
      <Button icon="pi pi-trash" size="small" text severity="danger"
        tooltip="Delete" tooltipOptions={{ position: 'top' }} onClick={() => confirmDelete(r)} />
    </div>
  );

  const toolbarLeft = (
    <div className="flex gap-2 items-center flex-wrap">
      <Button label="New Rule" icon="pi pi-plus" size="small" onClick={openNew}
        style={{ background: '#2563eb', borderColor: '#2563eb' }} />
      <span className="p-input-icon-left">
        <i className="pi pi-search" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)', position: 'absolute', color: '#94a3b8' }} />
        <InputText value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search rules…" className="pl-8 text-sm" style={{ paddingLeft: '2.2rem', height: '2.1rem' }} />
      </span>
      <Dropdown value={filterCategory} options={[{ label: 'All Categories', value: null }, ...CATEGORIES.map(c => ({ label: c, value: c }))]}
        onChange={e => setFilterCategory(e.value)} placeholder="Category" className="text-sm" style={{ height: '2.1rem' }} />
      <Dropdown value={filterStatus}
        options={[
          { label: 'All Statuses', value: null },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Draft', value: 'draft' },
        ]}
        onChange={e => setFilterStatus(e.value)} placeholder="Status" className="text-sm" style={{ height: '2.1rem' }} />
    </div>
  );

  const toolbarRight = (
    <span className="text-xs text-slate-400 font-medium">
      {filtered.length} of {rules.length} rules
    </span>
  );

  return (
    <PrimeReactProvider>
      <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f9' }}>
        <Toast ref={toast} />
        <ConfirmDialog />

        {/* Header */}
        <header style={{ background: '#1e293b' }} className="px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ background: '#2563eb' }}>
              <i className="pi pi-sliders-h text-white text-sm" />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">RuleForge</div>
              <div className="text-slate-400 text-xs">Business Rule Engine</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs">ACME Corp · v2.4.1</span>
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">SC</div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav className="w-52 flex-shrink-0 bg-white border-r border-slate-100 py-4 px-3 flex flex-col gap-1">
            <div className="sidebar-nav-item active">
              <i className="pi pi-list text-sm" /> All Rules
            </div>
            {CATEGORIES.map(cat => (
              <div key={cat} className="sidebar-nav-item"
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                style={filterCategory === cat ? { background: '#eff6ff', color: '#2563eb', fontWeight: 600 } : {}}>
                <i className="pi pi-tag text-sm" /> {cat}
              </div>
            ))}
            <div className="mt-auto border-t border-slate-100 pt-3">
              <div className="sidebar-nav-item"><i className="pi pi-history text-sm" /> Audit Log</div>
              <div className="sidebar-nav-item"><i className="pi pi-cog text-sm" /> Settings</div>
            </div>
          </nav>

          {/* Main */}
          <main className="flex-1 overflow-auto p-6">

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Rules', value: stats.total, icon: 'pi-list', color: '#2563eb' },
                { label: 'Active', value: stats.active, icon: 'pi-check-circle', color: '#22c55e' },
                { label: 'Draft', value: stats.draft, icon: 'pi-file-edit', color: '#f59e0b' },
                { label: 'Total Triggers', value: stats.triggers.toLocaleString(), icon: 'pi-bolt', color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: s.color + '18' }}>
                    <i className={`pi ${s.icon}`} style={{ color: s.color, fontSize: '1.1rem' }} />
                  </div>
                  <div>
                    <div className="mono text-xl font-bold text-slate-800">{s.value}</div>
                    <div className="text-xs text-slate-400 font-medium">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <Toolbar start={toolbarLeft} end={toolbarRight}
                  style={{ background: 'transparent', border: 'none', padding: 0 }} />
              </div>

              <DataTable
                value={filtered}
                selection={selected}
                onSelectionChange={e => setSelected(Array.isArray(e.value) ? e.value : [e.value as BusinessRule])}
                selectionMode="multiple"
                dataKey="id"
                sortField="priority"
                sortOrder={1}
                emptyMessage={
                  <div className="text-center py-12 text-slate-400">
                    <i className="pi pi-inbox text-3xl mb-3 block" />
                    No rules match your filters.
                  </div>
                }
                className="text-sm"
              >
                <Column selectionMode="multiple" style={{ width: '2.5rem' }} />
                <Column field="priority" header="Priority" body={priorityBody} sortable style={{ width: '6rem' }} />
                <Column field="name" header="Rule" body={nameBody} sortable style={{ minWidth: '220px' }} />
                <Column field="status" header="Status" body={statusBody} sortable style={{ width: '7rem' }} />
                <Column field="category" header="Category" body={categoryBody} sortable style={{ width: '140px' }} />
                <Column header="Conditions" body={conditionsBody} style={{ width: '130px' }} />
                <Column header="Actions" body={actionsBody} style={{ width: '100px' }} />
                <Column field="triggerCount" header="Triggers" body={triggersBody} sortable style={{ width: '90px' }} />
                <Column field="createdBy" header="Created By" style={{ width: '120px' }}
                  body={(r: BusinessRule) => <span className="text-xs text-slate-500">{r.createdBy}</span>} />
                <Column header="" body={actionsColBody} style={{ width: '110px' }} />
              </DataTable>
            </div>

          </main>
        </div>

        <RuleEditor
          rule={editingRule}
          visible={editorVisible}
          onHide={() => setEditorVisible(false)}
          onSave={handleSave}
        />

        <JsonViewDialog
          rule={jsonRule}
          visible={jsonRule !== null}
          onHide={() => setJsonRule(null)}
        />
      </div>
    </PrimeReactProvider>
  );
}
