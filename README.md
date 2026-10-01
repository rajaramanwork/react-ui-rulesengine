# RuleForge — React UI Rules Engine

A production-style **Business Rule Engine** mockup built with **React 19**, **PrimeReact 10**, **Vite 8**, and **Tailwind CSS v4**. Supports full CRUD for business rules with multi-group condition logic, typed actions, actuarial samples, and a JSON export viewer.

---

## Features

| Capability | Detail |
|---|---|
| **Rule CRUD** | Create, read, update, and delete business rules |
| **Condition Groups** | Multiple groups with AND / OR logic between and within groups |
| **Typed Actions** | Set field, send notification, trigger webhook, assign tag, block transaction, approve |
| **Priority Ordering** | Numeric priority controls rule evaluation order |
| **Status Lifecycle** | Draft → Active → Inactive with one-click toggle |
| **Category Filtering** | Sidebar nav + toolbar dropdown filter by category |
| **Full-text Search** | Live search across rule name and description |
| **JSON Viewer** | Syntax-highlighted JSON dialog with copy and download |
| **Actuarial Samples** | Pre-loaded underwriting rules (Preferred Plus, Table Rating, Smoker Loading) |
| **Toast Notifications** | Feedback on every save, delete, and status change |
| **Confirm Dialog** | Safe delete with confirmation prompt |

---

## Tech Stack

- **React 19** + **TypeScript 5.7**
- **PrimeReact 10** — DataTable, Dialog, Dropdown, Button, Toast, ConfirmDialog, SelectButton, InputText, InputNumber, Toolbar, Tag
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Vite 8** with hot reload
- **PrimeIcons 8**
- **Google Fonts** — Inter (UI), JetBrains Mono (code/data)

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9

### Install & Run

```bash
# Clone the repo
git clone https://github.com/rajaramanwork/react-ui-rulesengine.git
cd react-ui-rulesengine

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Open `http://localhost:8443` in your browser.

### Build for Production

```bash
pnpm build
pnpm preview
```

---

## Project Structure

```
src/
├── App.tsx            # Main application shell, layout, DataTable, filtering
├── RuleEditor.tsx     # Create / edit rule dialog (conditions + actions form)
├── JsonViewDialog.tsx # Syntax-highlighted JSON viewer with copy & download
├── data.ts            # Sample rules (including actuarial) and field catalog
├── types.ts           # TypeScript interfaces for BusinessRule, Condition, Action
├── index.css          # Tailwind v4 entrypoint, PrimeReact theme, Google Fonts
└── main.tsx           # React entry point
```

---

## Component Usage

### `<RuleEditor />`

Dialog for creating or editing a business rule. Handles condition groups, conditions, and actions.

```tsx
import RuleEditor from './RuleEditor';

<RuleEditor
  rule={existingRule}       // BusinessRule | undefined — omit for "New Rule"
  visible={editorVisible}   // boolean
  onHide={() => setEditorVisible(false)}
  onSave={(rule) => handleSave(rule)}  // receives the saved BusinessRule
/>
```

**Props:**

| Prop | Type | Description |
|---|---|---|
| `rule` | `BusinessRule \| undefined` | Rule to edit; `undefined` opens a blank form |
| `visible` | `boolean` | Controls dialog visibility |
| `onHide` | `() => void` | Called when dialog is dismissed |
| `onSave` | `(rule: BusinessRule) => void` | Called with the complete rule on save |

---

### `<JsonViewDialog />`

Dark-themed dialog that renders a `BusinessRule` as formatted, syntax-highlighted JSON. Includes line numbers, byte size, copy-to-clipboard, and file download.

```tsx
import JsonViewDialog from './JsonViewDialog';

<JsonViewDialog
  rule={selectedRule}                  // BusinessRule | null
  visible={selectedRule !== null}
  onHide={() => setSelectedRule(null)}
/>
```

**Props:**

| Prop | Type | Description |
|---|---|---|
| `rule` | `BusinessRule \| null` | Rule to display; `null` renders nothing |
| `visible` | `boolean` | Controls dialog visibility |
| `onHide` | `() => void` | Called when dialog is dismissed |

**JSON export shape:**

```json
{
  "$schema": "https://ruleforge.acme-life.com/schema/v1/business-rule.json",
  "id": "rule-act-001",
  "name": "Preferred Plus Underwriting Eligibility",
  "metadata": {
    "status": "active",
    "priority": 1,
    "category": "Actuarial",
    "createdBy": "Dr. Amara Osei, FLMI",
    "triggerCount": 3184
  },
  "conditions": {
    "groupOperator": "AND",
    "groups": [
      {
        "id": "cg-act-1a",
        "operator": "AND",
        "conditions": [
          { "id": "c-act-1", "field": "customer.smoker_status", "operator": "equals", "value": "Never" },
          { "id": "c-act-2", "field": "customer.age", "operator": "greater_than", "value": "17" }
        ]
      }
    ]
  },
  "actions": [
    { "id": "a-act-1", "type": "set_field", "target": "uw.mortality_rating", "value": "PREFERRED_PLUS" }
  ]
}
```

---

## Data Model

### `BusinessRule`

```ts
interface BusinessRule {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  priority: number;           // 1 = highest
  category: string;
  conditionGroups: ConditionGroup[];
  groupOperator: 'AND' | 'OR'; // how groups are joined
  actions: Action[];
  createdAt: string;          // ISO 8601
  updatedAt: string;
  createdBy: string;
  triggerCount: number;
}
```

### `ConditionGroup`

```ts
interface ConditionGroup {
  id: string;
  operator: 'AND' | 'OR';    // how conditions within the group are joined
  conditions: Condition[];
}
```

### `Condition`

```ts
interface Condition {
  id: string;
  field: string;              // e.g. "customer.age", "policy.sum_assured"
  operator: ConditionOperator;
  value: string;
}

type ConditionOperator =
  | 'equals' | 'not_equals'
  | 'greater_than' | 'less_than'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'is_null' | 'is_not_null'
  | 'in' | 'not_in';          // comma-separated values
```

### `Action`

```ts
interface Action {
  id: string;
  type: ActionType;
  target: string;   // field path, email address, webhook URL, or tag target
  value: string;    // the value to set or message to send
}

type ActionType =
  | 'set_field'
  | 'send_notification'
  | 'trigger_webhook'
  | 'assign_tag'
  | 'block_transaction'
  | 'approve';
```

---

## Actuarial Sample Rules

Three underwriting rules are pre-loaded under the **Actuarial** category:

| Rule | Conditions | Actions |
|---|---|---|
| **Preferred Plus Eligibility** | Non-smoker, age 18–60, BMI 18.5–27, ideal BP/cholesterol, no family history, sum assured ≤ $2M | Grants `PREFERRED_PLUS` table rating (100%), waives medical exam |
| **Substandard CV Load** | Uncontrolled hypertension (age 40+) OR early cardiac family history + high cholesterol | Table D rating (150%), $3.50/mil flat extra, CMO webhook for large policies |
| **Smoker Mortality Load** | Current/recent smoker, term life product, sum assured > $500k | 2.5× mortality load (Table 250%), mandatory APS, Swiss Re quota-share treaty |

These rules demonstrate multi-group OR logic, underwriting fields (`uw.*`, `policy.*`, `customer.bmi`, `customer.blood_pressure_systolic`), and reinsurance webhook actions.

---

## Available Fields

The field catalog covers:

| Namespace | Fields |
|---|---|
| `transaction.*` | amount, currency, country |
| `customer.*` | age, tier, risk_score, gender, smoker_status, bmi, blood_pressure_systolic, cholesterol_total, family_history_cardiac, family_history_cancer, occupation_class, hazardous_activity |
| `policy.*` | product_type, sum_assured, term_years, payment_frequency, reinsurance_treaty |
| `uw.*` | medical_exam_required, attending_physician_statement, lab_result_glucose, lab_result_egfr, lab_result_psa, mortality_rating, table_rating, flat_extra_per_mil |
| `order.*` | item_count, total, category |
| `user.*` | email, role, registration_days |
| `session.*` | ip_country |

---

## License

MIT
