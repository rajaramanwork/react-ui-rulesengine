import type { BusinessRule } from './types';

export const FIELDS = [
  // Transaction
  'transaction.amount', 'transaction.currency', 'transaction.country',
  // Customer / policyholder
  'customer.age', 'customer.tier', 'customer.risk_score',
  'customer.gender', 'customer.smoker_status', 'customer.bmi',
  'customer.blood_pressure_systolic', 'customer.cholesterol_total',
  'customer.family_history_cardiac', 'customer.family_history_cancer',
  'customer.occupation_class', 'customer.hazardous_activity',
  // Policy
  'policy.product_type', 'policy.sum_assured', 'policy.term_years',
  'policy.payment_frequency', 'policy.reinsurance_treaty',
  // Underwriting
  'uw.medical_exam_required', 'uw.attending_physician_statement',
  'uw.lab_result_glucose', 'uw.lab_result_egfr', 'uw.lab_result_psa',
  'uw.mortality_rating', 'uw.table_rating', 'uw.flat_extra_per_mil',
  // Order / ecommerce (kept for backward compat)
  'order.item_count', 'order.total', 'order.category',
  'user.email', 'user.role', 'user.registration_days',
  'device.type', 'device.os', 'session.ip_country',
];

export const CATEGORIES = [
  'Actuarial', 'Fraud Detection', 'Pricing', 'Eligibility', 'Compliance', 'Marketing', 'Operations',
];

export const initialRules: BusinessRule[] = [
  /* ── Actuarial rules ─────────────────────────────────────────── */
  {
    id: 'rule-act-001',
    name: 'Preferred Plus Underwriting Eligibility',
    description: 'Grant Preferred Plus class to non-smoking applicants aged 18–60 with ideal vitals, no adverse family history, and sum assured ≤ $2 000 000, bypassing full medical exam.',
    status: 'active',
    priority: 1,
    category: 'Actuarial',
    groupOperator: 'AND',
    conditionGroups: [
      {
        id: 'cg-act-1a',
        operator: 'AND',
        conditions: [
          { id: 'c-act-1', field: 'customer.smoker_status', operator: 'equals', value: 'Never' },
          { id: 'c-act-2', field: 'customer.age', operator: 'greater_than', value: '17' },
          { id: 'c-act-3', field: 'customer.age', operator: 'less_than', value: '61' },
          { id: 'c-act-4', field: 'customer.bmi', operator: 'greater_than', value: '18.4' },
          { id: 'c-act-5', field: 'customer.bmi', operator: 'less_than', value: '27.1' },
        ],
      },
      {
        id: 'cg-act-1b',
        operator: 'AND',
        conditions: [
          { id: 'c-act-6', field: 'customer.blood_pressure_systolic', operator: 'less_than', value: '130' },
          { id: 'c-act-7', field: 'customer.cholesterol_total', operator: 'less_than', value: '200' },
          { id: 'c-act-8', field: 'customer.family_history_cardiac', operator: 'equals', value: 'false' },
          { id: 'c-act-9', field: 'customer.family_history_cancer', operator: 'equals', value: 'false' },
          { id: 'c-act-10', field: 'policy.sum_assured', operator: 'less_than', value: '2000001' },
        ],
      },
    ],
    actions: [
      { id: 'a-act-1', type: 'set_field', target: 'uw.mortality_rating', value: 'PREFERRED_PLUS' },
      { id: 'a-act-2', type: 'set_field', target: 'uw.table_rating', value: '100' },
      { id: 'a-act-3', type: 'set_field', target: 'uw.medical_exam_required', value: 'false' },
      { id: 'a-act-4', type: 'assign_tag', target: 'policy', value: 'NON_MED_PREFERRED_PLUS' },
    ],
    createdAt: '2025-11-01T08:00:00Z',
    updatedAt: '2026-08-15T09:30:00Z',
    createdBy: 'Dr. Amara Osei, FLMI',
    triggerCount: 3184,
  },

  {
    id: 'rule-act-002',
    name: 'Substandard Table Rating — Cardiovascular Load',
    description: 'Apply a table rating surcharge and flat extra for applicants with uncontrolled hypertension or prior cardiac events. Routes file to Chief Medical Officer for sign-off when sum assured exceeds $5 000 000.',
    status: 'active',
    priority: 2,
    category: 'Actuarial',
    groupOperator: 'OR',
    conditionGroups: [
      {
        id: 'cg-act-2a',
        operator: 'AND',
        conditions: [
          { id: 'c-act-11', field: 'customer.blood_pressure_systolic', operator: 'greater_than', value: '159' },
          { id: 'c-act-12', field: 'customer.age', operator: 'greater_than', value: '39' },
        ],
      },
      {
        id: 'cg-act-2b',
        operator: 'AND',
        conditions: [
          { id: 'c-act-13', field: 'customer.family_history_cardiac', operator: 'equals', value: 'true' },
          { id: 'c-act-14', field: 'customer.age', operator: 'less_than', value: '50' },
          { id: 'c-act-15', field: 'customer.cholesterol_total', operator: 'greater_than', value: '239' },
        ],
      },
    ],
    actions: [
      { id: 'a-act-5', type: 'set_field', target: 'uw.mortality_rating', value: 'SUBSTANDARD' },
      { id: 'a-act-6', type: 'set_field', target: 'uw.table_rating', value: '150' },
      { id: 'a-act-7', type: 'set_field', target: 'uw.flat_extra_per_mil', value: '3.50' },
      { id: 'a-act-8', type: 'assign_tag', target: 'policy', value: 'TABLE_D_CARDIO_LOAD' },
      { id: 'a-act-9', type: 'trigger_webhook', target: 'https://uw.acme-life.com/hooks/cmo-referral', value: 'sum_assured_gt_5000000' },
    ],
    createdAt: '2026-01-20T10:15:00Z',
    updatedAt: '2026-09-10T14:00:00Z',
    createdBy: 'Dr. Amara Osei, FLMI',
    triggerCount: 629,
  },

  {
    id: 'rule-act-003',
    name: 'Smoker Mortality Loading — Term Life',
    description: 'Apply a 2.5× base mortality load and mandatory medical exam for current smokers applying for term life products with sum assured above $500 000. Triggers reinsurance quota-share notification to Swiss Re treaty.',
    status: 'active',
    priority: 3,
    category: 'Actuarial',
    groupOperator: 'AND',
    conditionGroups: [
      {
        id: 'cg-act-3a',
        operator: 'AND',
        conditions: [
          { id: 'c-act-16', field: 'customer.smoker_status', operator: 'in', value: 'Current,Recent_12mo' },
          { id: 'c-act-17', field: 'policy.product_type', operator: 'equals', value: 'TERM_LIFE' },
          { id: 'c-act-18', field: 'policy.sum_assured', operator: 'greater_than', value: '500000' },
        ],
      },
    ],
    actions: [
      { id: 'a-act-10', type: 'set_field', target: 'uw.mortality_rating', value: 'SMOKER_LOADED' },
      { id: 'a-act-11', type: 'set_field', target: 'uw.table_rating', value: '250' },
      { id: 'a-act-12', type: 'set_field', target: 'uw.medical_exam_required', value: 'true' },
      { id: 'a-act-13', type: 'set_field', target: 'uw.attending_physician_statement', value: 'REQUIRED' },
      { id: 'a-act-14', type: 'set_field', target: 'policy.reinsurance_treaty', value: 'SWISS_RE_QS_2026' },
      { id: 'a-act-15', type: 'trigger_webhook', target: 'https://ri.swissre.com/api/cession-notify', value: '' },
      { id: 'a-act-16', type: 'send_notification', target: 'underwriting@acme-life.com', value: 'Smoker term life above $500k — full UW file required' },
    ],
    createdAt: '2026-02-05T07:45:00Z',
    updatedAt: '2026-09-22T11:00:00Z',
    createdBy: 'Helena Marsh, ACAS',
    triggerCount: 1447,
  },

  /* ── Original rules ───────────────────────────────────────────── */
  {
    id: 'rule-001',
    name: 'High-Value Transaction Flag',
    description: 'Flag transactions over $10,000 from high-risk countries for manual review',
    status: 'active',
    priority: 4,
    category: 'Fraud Detection',
    conditionGroups: [
      {
        id: 'cg-1',
        operator: 'AND',
        conditions: [
          { id: 'c-1', field: 'transaction.amount', operator: 'greater_than', value: '10000' },
          { id: 'c-2', field: 'session.ip_country', operator: 'in', value: 'CN,RU,NG,VN' },
        ],
      },
    ],
    groupOperator: 'AND',
    actions: [
      { id: 'a-1', type: 'assign_tag', target: 'transaction', value: 'MANUAL_REVIEW' },
      { id: 'a-2', type: 'send_notification', target: 'fraud-team@acme.com', value: 'High-value suspicious transaction detected' },
    ],
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-07-22T14:30:00Z',
    createdBy: 'Sarah Chen',
    triggerCount: 847,
  },
  {
    id: 'rule-002',
    name: 'VIP Customer Free Shipping',
    description: 'Automatically apply free shipping for Platinum-tier customers on orders over $50',
    status: 'active',
    priority: 5,
    category: 'Pricing',
    conditionGroups: [
      {
        id: 'cg-2',
        operator: 'AND',
        conditions: [
          { id: 'c-3', field: 'customer.tier', operator: 'equals', value: 'Platinum' },
          { id: 'c-4', field: 'order.total', operator: 'greater_than', value: '50' },
        ],
      },
    ],
    groupOperator: 'AND',
    actions: [
      { id: 'a-3', type: 'set_field', target: 'order.shipping_cost', value: '0' },
      { id: 'a-4', type: 'assign_tag', target: 'order', value: 'FREE_SHIPPING' },
    ],
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-09-01T08:15:00Z',
    createdBy: 'Marcus Webb',
    triggerCount: 12340,
  },
  {
    id: 'rule-003',
    name: 'Under-Age Restriction',
    description: 'Block purchase of age-restricted categories for customers under 21',
    status: 'active',
    priority: 6,
    category: 'Compliance',
    conditionGroups: [
      {
        id: 'cg-3',
        operator: 'AND',
        conditions: [
          { id: 'c-5', field: 'customer.age', operator: 'less_than', value: '21' },
          { id: 'c-6', field: 'order.category', operator: 'in', value: 'Alcohol,Tobacco,Gambling' },
        ],
      },
    ],
    groupOperator: 'AND',
    actions: [
      { id: 'a-5', type: 'block_transaction', target: 'order', value: 'AGE_RESTRICTION' },
    ],
    createdAt: '2026-01-05T16:00:00Z',
    updatedAt: '2026-06-14T10:00:00Z',
    createdBy: 'Legal Team',
    triggerCount: 203,
  },
  {
    id: 'rule-004',
    name: 'New User Welcome Discount',
    description: 'Apply 15% discount on first order for users registered within last 30 days',
    status: 'draft',
    priority: 10,
    category: 'Marketing',
    conditionGroups: [
      {
        id: 'cg-4',
        operator: 'AND',
        conditions: [
          { id: 'c-7', field: 'user.registration_days', operator: 'less_than', value: '30' },
          { id: 'c-8', field: 'order.item_count', operator: 'greater_than', value: '0' },
        ],
      },
    ],
    groupOperator: 'AND',
    actions: [
      { id: 'a-6', type: 'set_field', target: 'order.discount_pct', value: '15' },
      { id: 'a-7', type: 'assign_tag', target: 'order', value: 'WELCOME_PROMO' },
    ],
    createdAt: '2026-09-20T13:00:00Z',
    updatedAt: '2026-09-28T17:45:00Z',
    createdBy: 'Priya Nair',
    triggerCount: 0,
  },
  {
    id: 'rule-005',
    name: 'Webhook on Large Refunds',
    description: 'Trigger external accounting webhook when refund exceeds $500',
    status: 'inactive',
    priority: 9,
    category: 'Operations',
    conditionGroups: [
      {
        id: 'cg-5',
        operator: 'AND',
        conditions: [
          { id: 'c-9', field: 'transaction.amount', operator: 'greater_than', value: '500' },
          { id: 'c-10', field: 'transaction.currency', operator: 'equals', value: 'USD' },
        ],
      },
    ],
    groupOperator: 'AND',
    actions: [
      { id: 'a-8', type: 'trigger_webhook', target: 'https://accounting.acme.com/hooks/refund', value: '' },
    ],
    createdAt: '2026-03-22T09:30:00Z',
    updatedAt: '2026-08-10T11:20:00Z',
    createdBy: 'DevOps',
    triggerCount: 91,
  },
];
