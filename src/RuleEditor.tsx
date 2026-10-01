import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { InputNumber } from 'primereact/inputnumber';
import type { BusinessRule, Condition, ConditionGroup, Action, ActionType, ConditionOperator, LogicalOperator, RuleStatus } from './types';
import { FIELDS, CATEGORIES } from './data';

const OPERATORS: { label: string; value: ConditionOperator }[] = [
  { label: '= equals', value: 'equals' },
  { label: '≠ not equals', value: 'not_equals' },
  { label: '> greater than', value: 'greater_than' },
  { label: '< less than', value: 'less_than' },
  { label: '⊃ contains', value: 'contains' },
  { label: '⊅ not contains', value: 'not_contains' },
  { label: 'starts with', value: 'starts_with' },
  { label: 'ends with', value: 'ends_with' },
  { label: '∈ in (csv)', value: 'in' },
  { label: '∉ not in (csv)', value: 'not_in' },
  { label: 'is null', value: 'is_null' },
  { label: 'is not null', value: 'is_not_null' },
];

const ACTION_TYPES: { label: string; value: ActionType }[] = [
  { label: 'Set Field', value: 'set_field' },
  { label: 'Send Notification', value: 'send_notification' },
  { label: 'Trigger Webhook', value: 'trigger_webhook' },
  { label: 'Assign Tag', value: 'assign_tag' },
  { label: 'Block Transaction', value: 'block_transaction' },
  { label: 'Approve', value: 'approve' },
];

const STATUS_OPTS: { label: string; value: RuleStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function blankCondition(): Condition {
  return { id: uid(), field: 'transaction.amount', operator: 'equals', value: '' };
}
function blankGroup(): ConditionGroup {
  return { id: uid(), operator: 'AND', conditions: [blankCondition()] };
}
function blankAction(): Action {
  return { id: uid(), type: 'set_field', target: '', value: '' };
}
function blankRule(): BusinessRule {
  return {
    id: uid(),
    name: '',
    description: '',
    status: 'draft',
    priority: 10,
    category: 'Operations',
    conditionGroups: [blankGroup()],
    groupOperator: 'AND',
    actions: [blankAction()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'You',
    triggerCount: 0,
  };
}

interface Props {
  rule?: BusinessRule;
  visible: boolean;
  onHide: () => void;
  onSave: (r: BusinessRule) => void;
}

export default function RuleEditor({ rule, visible, onHide, onSave }: Props) {
  const [form, setForm] = useState<BusinessRule>(rule ?? blankRule());

  // reset form when rule changes
  const handleShow = () => setForm(rule ?? blankRule());

  const set = (patch: Partial<BusinessRule>) => setForm(f => ({ ...f, ...patch }));

  /* ── Condition helpers ── */
  const updateGroup = (gid: string, patch: Partial<ConditionGroup>) =>
    set({ conditionGroups: form.conditionGroups.map(g => g.id === gid ? { ...g, ...patch } : g) });

  const addGroup = () => set({ conditionGroups: [...form.conditionGroups, blankGroup()] });
  const removeGroup = (gid: string) => set({ conditionGroups: form.conditionGroups.filter(g => g.id !== gid) });

  const addCondition = (gid: string) =>
    updateGroup(gid, { conditions: [...form.conditionGroups.find(g => g.id === gid)!.conditions, blankCondition()] });

  const updateCondition = (gid: string, cid: string, patch: Partial<Condition>) =>
    updateGroup(gid, {
      conditions: form.conditionGroups.find(g => g.id === gid)!.conditions.map(c => c.id === cid ? { ...c, ...patch } : c),
    });

  const removeCondition = (gid: string, cid: string) =>
    updateGroup(gid, { conditions: form.conditionGroups.find(g => g.id === gid)!.conditions.filter(c => c.id !== cid) });

  /* ── Action helpers ── */
  const addAction = () => set({ actions: [...form.actions, blankAction()] });
  const removeAction = (aid: string) => set({ actions: form.actions.filter(a => a.id !== aid) });
  const updateAction = (aid: string, patch: Partial<Action>) =>
    set({ actions: form.actions.map(a => a.id === aid ? { ...a, ...patch } : a) });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  const logicalOpts = [{ label: 'AND', value: 'AND' }, { label: 'OR', value: 'OR' }];

  const footer = (
    <div className="flex justify-end gap-2 pt-2">
      <Button label="Cancel" severity="secondary" outlined onClick={onHide} size="small" />
      <Button label="Save Rule" icon="pi pi-check" onClick={handleSave} size="small"
        style={{ background: '#2563eb', borderColor: '#2563eb' }} />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      onShow={handleShow}
      header={rule ? `Edit Rule — ${rule.name}` : 'New Business Rule'}
      footer={footer}
      style={{ width: '860px', maxWidth: '96vw' }}
      draggable={false}
      modal
    >
      <div className="flex flex-col gap-6 pt-4">

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rule Name *</label>
            <InputText value={form.name} onChange={e => set({ name: e.target.value })}
              placeholder="e.g. High-Value Transaction Flag" className="w-full" />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
            <InputTextarea value={form.description} onChange={e => set({ description: e.target.value })}
              rows={2} placeholder="What does this rule do?" className="w-full" autoResize />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
            <Dropdown value={form.category} options={CATEGORIES} onChange={e => set({ category: e.value })}
              placeholder="Select category" className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</label>
            <InputNumber value={form.priority} onValueChange={e => set({ priority: e.value ?? 10 })}
              min={1} max={100} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
            <Dropdown value={form.status} options={STATUS_OPTS} onChange={e => set({ status: e.value })}
              className="w-full" />
          </div>
        </div>

        {/* Condition Groups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-slate-700">Condition Groups</span>
              <span className="text-xs text-slate-400 ml-2">Rules fire when conditions match</span>
            </div>
            {form.conditionGroups.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Groups joined by</span>
                <SelectButton value={form.groupOperator}
                  options={logicalOpts}
                  onChange={e => set({ groupOperator: e.value as LogicalOperator })}
                  className="text-xs" />
              </div>
            )}
          </div>

          {form.conditionGroups.map((group, gi) => (
            <div key={group.id} className="mb-3 border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">GROUP {gi + 1}</span>
                  <SelectButton value={group.operator}
                    options={logicalOpts}
                    onChange={e => updateGroup(group.id, { operator: e.value as LogicalOperator })}
                    className="text-xs" />
                </div>
                <div className="flex gap-1">
                  <Button icon="pi pi-plus" size="small" text severity="info"
                    tooltip="Add condition" tooltipOptions={{ position: 'top' }}
                    onClick={() => addCondition(group.id)} />
                  {form.conditionGroups.length > 1 && (
                    <Button icon="pi pi-trash" size="small" text severity="danger"
                      tooltip="Remove group" tooltipOptions={{ position: 'top' }}
                      onClick={() => removeGroup(group.id)} />
                  )}
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {group.conditions.map((cond) => (
                  <div key={cond.id} className="condition-row flex items-center gap-2 flex-wrap">
                    <Dropdown value={cond.field}
                      options={FIELDS.map(f => ({ label: f, value: f }))}
                      onChange={e => updateCondition(group.id, cond.id, { field: e.value })}
                      className="flex-1 min-w-40 text-sm" filter />
                    <Dropdown value={cond.operator}
                      options={OPERATORS}
                      onChange={e => updateCondition(group.id, cond.id, { operator: e.value })}
                      className="min-w-36 text-sm" />
                    {!['is_null', 'is_not_null'].includes(cond.operator) && (
                      <InputText value={cond.value}
                        onChange={e => updateCondition(group.id, cond.id, { value: e.target.value })}
                        placeholder="value" className="min-w-28 flex-1 mono text-sm" />
                    )}
                    {group.conditions.length > 1 && (
                      <Button icon="pi pi-times" size="small" text severity="danger"
                        onClick={() => removeCondition(group.id, cond.id)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button label="Add Condition Group" icon="pi pi-plus" size="small" outlined severity="secondary"
            onClick={addGroup} />
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-slate-700">Actions</span>
              <span className="text-xs text-slate-400 ml-2">Executed when rule fires</span>
            </div>
          </div>

          {form.actions.map((action) => (
            <div key={action.id} className="action-row flex items-center gap-2 flex-wrap">
              <Dropdown value={action.type}
                options={ACTION_TYPES}
                onChange={e => updateAction(action.id, { type: e.value })}
                className="min-w-40 text-sm" />
              <InputText value={action.target}
                onChange={e => updateAction(action.id, { target: e.target.value })}
                placeholder="target / field / recipient"
                className="flex-1 min-w-36 mono text-sm" />
              <InputText value={action.value}
                onChange={e => updateAction(action.id, { value: e.target.value })}
                placeholder="value (optional)"
                className="flex-1 min-w-28 mono text-sm" />
              {form.actions.length > 1 && (
                <Button icon="pi pi-times" size="small" text severity="danger"
                  onClick={() => removeAction(action.id)} />
              )}
            </div>
          ))}

          <Button label="Add Action" icon="pi pi-plus" size="small" outlined severity="info"
            className="mt-2" onClick={addAction} />
        </div>

      </div>
    </Dialog>
  );
}
