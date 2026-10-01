export type ConditionOperator =
  | 'equals' | 'not_equals' | 'greater_than' | 'less_than'
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'is_null' | 'is_not_null' | 'in' | 'not_in';

export type LogicalOperator = 'AND' | 'OR';
export type RuleStatus = 'active' | 'inactive' | 'draft';
export type ActionType = 'set_field' | 'send_notification' | 'trigger_webhook' | 'assign_tag' | 'block_transaction' | 'approve';

export interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface ConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: Condition[];
}

export interface Action {
  id: string;
  type: ActionType;
  target: string;
  value: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  status: RuleStatus;
  priority: number;
  category: string;
  conditionGroups: ConditionGroup[];
  groupOperator: LogicalOperator;
  actions: Action[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  triggerCount: number;
}
