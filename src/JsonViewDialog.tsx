import { useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import type { BusinessRule } from './types';

interface Props {
  rule: BusinessRule | null;
  visible: boolean;
  onHide: () => void;
}

function highlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      },
    );
}

function ruleToExportShape(rule: BusinessRule) {
  return {
    $schema: 'https://ruleforge.acme-life.com/schema/v1/business-rule.json',
    id: rule.id,
    name: rule.name,
    description: rule.description,
    metadata: {
      status: rule.status,
      priority: rule.priority,
      category: rule.category,
      createdBy: rule.createdBy,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      triggerCount: rule.triggerCount,
    },
    conditions: {
      groupOperator: rule.groupOperator,
      groups: rule.conditionGroups.map((g) => ({
        id: g.id,
        operator: g.operator,
        conditions: g.conditions.map((c) => ({
          id: c.id,
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
      })),
    },
    actions: rule.actions.map((a) => ({
      id: a.id,
      type: a.type,
      target: a.target,
      value: a.value,
    })),
  };
}

export default function JsonViewDialog({ rule, visible, onHide }: Props) {
  const toast = useRef<Toast>(null);

  if (!rule) return null;

  const exported = ruleToExportShape(rule);
  const json = JSON.stringify(exported, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(json).then(() => {
      toast.current?.show({ severity: 'success', summary: 'Copied', detail: 'JSON copied to clipboard', life: 2000 });
    });
  };

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rule-${rule.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const header = (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: '#0f172a' }}>
        <i className="pi pi-code text-xs" style={{ color: '#38bdf8' }} />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-100 leading-tight">Rule JSON</div>
        <div className="text-xs text-slate-400 font-normal mono mt-0.5">{rule.id}</div>
      </div>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between"
      style={{ background: '#0f172a', borderTop: '1px solid #1e293b', margin: '-0.5rem -1.5rem -1rem', padding: '0.75rem 1.25rem' }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: '#475569' }}>
        {json.split('\n').length} lines · {new Blob([json]).size} bytes
      </span>
      <div className="flex gap-2">
        <Button label="Download" icon="pi pi-download" size="small" outlined
          style={{ borderColor: '#334155', color: '#94a3b8' }}
          onClick={download} />
        <Button label="Copy" icon="pi pi-copy" size="small"
          style={{ background: '#2563eb', borderColor: '#2563eb' }}
          onClick={copy} />
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        onHide={onHide}
        header={header}
        footer={footer}
        style={{ width: '720px', maxWidth: '95vw' }}
        draggable={false}
        modal
        contentStyle={{ padding: 0, background: '#0f172a' }}
        headerStyle={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}
      >
        <div style={{ position: 'relative' }}>
          {/* Line numbers + code */}
          <div
            style={{
              display: 'flex',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.78rem',
              lineHeight: '1.65',
              overflowX: 'auto',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            {/* Gutter */}
            <div
              style={{
                padding: '1rem 0.75rem',
                textAlign: 'right',
                color: '#334155',
                userSelect: 'none',
                borderRight: '1px solid #1e293b',
                minWidth: '3rem',
                background: '#0a1120',
              }}
            >
              {json.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code */}
            <pre
              style={{ margin: 0, padding: '1rem 1.25rem', flex: 1, color: '#cbd5e1', background: 'transparent' }}
              dangerouslySetInnerHTML={{ __html: highlight(json) }}
            />
          </div>
        </div>

        <style>{`
          .json-key    { color: #7dd3fc; }
          .json-string { color: #86efac; }
          .json-number { color: #fda4af; }
          .json-bool   { color: #fb923c; }
          .json-null   { color: #94a3b8; }
        `}</style>
      </Dialog>
    </>
  );
}
