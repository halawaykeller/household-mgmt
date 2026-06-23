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

// A solution card created by the partners (vs the four built-in ones)
export interface CustomSolution {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
}

export interface AppState {
  screen: 'align' | 'score' | 'decide';
  weights: { mental: number; ick: number };   // defaults 1.0 and 0.5
  align: { you: string; partner: string }[];  // one entry per alignment question
  tasks: Task[];
  options: Record<string, boolean>;           // solution id → "we're considering it"
  customSolutions: CustomSolution[];          // solutions added by the partners
  comments: Record<string, string[]>;         // solution id → list of comments
  budgetMonthly: string;
  plan: string;
}

// What the API returns when you create or fetch a session
export interface Session {
  id: string;
  state: AppState;
}
