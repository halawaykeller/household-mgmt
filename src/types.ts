export type Assignment = 'me' | 'partner' | 'both' | 'outsource' | 'na';

export interface Task {
  id: string;
  category: string;
  name: string;
  minutesPerOccurrence: number;
  occurrencesPerMonth: number;
  mental: 0 | 1 | 2 | 3;
  ick: 0 | 1 | 2;
  assignment: Assignment;
}

// One person's slice of the session — stored independently for each seat.
export interface PersonData {
  name: string;
  alignAnswers: string[];                    // indexed by ALIGN_QUESTIONS
  tasks: Task[];
  weights: { mental: number; ick: number };
}

export interface CustomSolution {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
}

export interface AppState {
  screen: 'align' | 'score' | 'decide';
  a: PersonData;
  b: PersonData;
  options: Record<string, boolean>;
  customSolutions: CustomSolution[];
  comments: Record<string, string[]>;
  budgetMonthly: string;
  plan: string;
}

export type Seat = 'a' | 'b';

export interface Session {
  id: string;
  state: AppState;
}
