// Every value assignment for a task. 'both' splits the load 50/50;
// 'outsource' goes to a separate bucket excluded from the person balance.
export type Assignment = 'me' | 'partner' | 'both' | 'outsource' | 'na';

export interface Task {
  id: string;
  category: string;
  name: string;
  minutesPerOccurrence: number;
  occurrencesPerMonth: number;
  mental: 0 | 1 | 2 | 3;  // ongoing noticing / planning / remembering
  ick: 0 | 1 | 2;         // unpleasantness
  assignment: Assignment;
}

export interface AppState {
  screen: 'align' | 'score' | 'decide';
  weights: { mental: number; ick: number };   // defaults 1.0 and 0.5
  align: { you: string; partner: string }[];  // one entry per alignment question
  tasks: Task[];
  options: Record<string, boolean>;           // solution id → "we're considering it"
  budgetMonthly: string;
  plan: string;
}

// What the API returns when you create or fetch a session
export interface Session {
  id: string;
  state: AppState;
}
