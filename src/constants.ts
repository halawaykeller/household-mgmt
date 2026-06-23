// Seed data verbatim from household-app-mockup.html — these are the real tasks,
// questions, and solution options for the Align · Score · Decide flow.

import type { Task } from './types';

export const CATEGORY_ORDER = [
  'Food & cooking',
  'Kitchen cleanup',
  'Cleaning & bathroom',
  'Laundry',
  'Cats',
  'Plants & home',
  'Admin & mental load',
];

export const ALIGN_QUESTIONS = [
  "What's important to you about how the house runs?",
  'What does "good" look like to you? (be concrete)',
  "What do you hate doing, or not want to do often?",
  "What's your monthly budget for solving these with money?",
  "When you're sick / tired / can't hold up your end — what do you want to happen?",
  "When your partner can't hold up their end — what are you willing to give?",
];

export interface SolutionOption {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
}

export const SOLUTION_OPTIONS: SolutionOption[] = [
  {
    id: 'o1',
    title: 'Have the housekeeper come every other week',
    pros: ['No extra work for us — nothing to change'],
    cons: [
      'More expensive',
      "We don't get more self-sufficient",
      "Doesn't touch cooking, groceries, repairs",
    ],
  },
  {
    id: 'o2',
    title: 'Each clean only our own mess',
    pros: ["Nobody cleans up after anyone else"],
    cons: [
      'Breaks down for shared tasks (tub, vacuuming)',
      "Doesn't touch cooking, groceries, repairs",
    ],
  },
  {
    id: 'o3',
    title: 'Use heuristics (e.g. the Resistor dish rule)',
    pros: ['Easy to remember', 'Everyone just handles themselves'],
    cons: [
      "We don't always agree on the heuristic",
      'No heuristic for everything',
      'A bit transactional; weak for shared spaces',
    ],
  },
  {
    id: 'o4',
    title: 'Make a chore schedule',
    pros: [
      'Work gets done routinely',
      "Unambiguous whose job is what",
      'Genuinely shared labor',
    ],
    cons: [
      'Falls apart if not adhered to',
      'Can be too rigid',
      'Some tasks are much bigger than others',
    ],
  },
];

// Default task list. All tasks start unassigned ('na') so the couple
// fills in assignments together during the Score phase.
export const DEFAULT_TASKS: Omit<Task, 'id'>[] = [
  // Food & cooking
  { category: 'Food & cooking', name: 'Meal planning for the week', minutesPerOccurrence: 20, occurrencesPerMonth: 4, mental: 3, ick: 0, assignment: 'na' },
  { category: 'Food & cooking', name: 'Grocery list / ordering', minutesPerOccurrence: 15, occurrencesPerMonth: 4, mental: 2, ick: 0, assignment: 'na' },
  { category: 'Food & cooking', name: 'Grocery shopping + unpacking', minutesPerOccurrence: 45, occurrencesPerMonth: 4, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Food & cooking', name: 'Weeknight cooking', minutesPerOccurrence: 35, occurrencesPerMonth: 20, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Food & cooking', name: 'Bigger weekend / batch cooking', minutesPerOccurrence: 75, occurrencesPerMonth: 4, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Food & cooking', name: 'Pack lunches / portion leftovers', minutesPerOccurrence: 10, occurrencesPerMonth: 12, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Food & cooking', name: 'Manage fridge / toss old food', minutesPerOccurrence: 10, occurrencesPerMonth: 4, mental: 1, ick: 1, assignment: 'na' },
  // Kitchen cleanup
  { category: 'Kitchen cleanup', name: 'Dishes (load/unload dishwasher)', minutesPerOccurrence: 12, occurrencesPerMonth: 30, mental: 0, ick: 1, assignment: 'na' },
  { category: 'Kitchen cleanup', name: 'Hand-wash pots & pans', minutesPerOccurrence: 10, occurrencesPerMonth: 20, mental: 0, ick: 1, assignment: 'na' },
  { category: 'Kitchen cleanup', name: 'Wipe counters', minutesPerOccurrence: 6, occurrencesPerMonth: 20, mental: 0, ick: 0, assignment: 'na' },
  { category: 'Kitchen cleanup', name: 'Wipe stove / oven', minutesPerOccurrence: 10, occurrencesPerMonth: 8, mental: 0, ick: 1, assignment: 'na' },
  { category: 'Kitchen cleanup', name: 'Wipe butcher block', minutesPerOccurrence: 6, occurrencesPerMonth: 12, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Kitchen cleanup', name: 'Kitchen trash out', minutesPerOccurrence: 5, occurrencesPerMonth: 12, mental: 0, ick: 1, assignment: 'na' },
  { category: 'Kitchen cleanup', name: 'Sweep & quick mop kitchen', minutesPerOccurrence: 12, occurrencesPerMonth: 12, mental: 0, ick: 0, assignment: 'na' },
  // Cleaning & bathroom
  { category: 'Cleaning & bathroom', name: 'Daily tidy — put stuff away', minutesPerOccurrence: 15, occurrencesPerMonth: 30, mental: 2, ick: 0, assignment: 'na' },
  { category: 'Cleaning & bathroom', name: 'Run / empty / refill robot vacuum', minutesPerOccurrence: 5, occurrencesPerMonth: 12, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Cleaning & bathroom', name: 'Deep clean robot vacuum (brushes/filter)', minutesPerOccurrence: 20, occurrencesPerMonth: 2, mental: 1, ick: 1, assignment: 'na' },
  { category: 'Cleaning & bathroom', name: 'Vacuum / sweep (edges & spots)', minutesPerOccurrence: 20, occurrencesPerMonth: 4, mental: 0, ick: 0, assignment: 'na' },
  { category: 'Cleaning & bathroom', name: 'Mop floors (full)', minutesPerOccurrence: 25, occurrencesPerMonth: 2, mental: 0, ick: 1, assignment: 'na' },
  { category: 'Cleaning & bathroom', name: 'Clean the bathroom (toilet, sink, shower)', minutesPerOccurrence: 30, occurrencesPerMonth: 4, mental: 0, ick: 2, assignment: 'na' },
  { category: 'Cleaning & bathroom', name: 'Dusting', minutesPerOccurrence: 20, occurrencesPerMonth: 2, mental: 0, ick: 0, assignment: 'na' },
  { category: 'Cleaning & bathroom', name: 'Trash & recycling out + sort', minutesPerOccurrence: 10, occurrencesPerMonth: 8, mental: 1, ick: 1, assignment: 'na' },
  // Laundry
  { category: 'Laundry', name: 'Sort & pack laundry', minutesPerOccurrence: 8, occurrencesPerMonth: 8, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Laundry', name: 'Take to laundromat', minutesPerOccurrence: 20, occurrencesPerMonth: 8, mental: 1, ick: 1, assignment: 'na' },
  { category: 'Laundry', name: 'Pick up from laundromat', minutesPerOccurrence: 20, occurrencesPerMonth: 8, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Laundry', name: 'Fold & put away', minutesPerOccurrence: 25, occurrencesPerMonth: 8, mental: 0, ick: 0, assignment: 'na' },
  { category: 'Laundry', name: 'Change bed linens', minutesPerOccurrence: 15, occurrencesPerMonth: 4, mental: 0, ick: 0, assignment: 'na' },
  { category: 'Laundry', name: 'Towels & kitchen cloths', minutesPerOccurrence: 10, occurrencesPerMonth: 4, mental: 0, ick: 0, assignment: 'na' },
  // Cats
  { category: 'Cats', name: 'Feed cats (AM/PM)', minutesPerOccurrence: 5, occurrencesPerMonth: 60, mental: 0, ick: 0, assignment: 'na' },
  { category: 'Cats', name: 'Fresh water', minutesPerOccurrence: 3, occurrencesPerMonth: 30, mental: 0, ick: 0, assignment: 'na' },
  { category: 'Cats', name: 'Empty Litter-Robot waste drawer', minutesPerOccurrence: 5, occurrencesPerMonth: 12, mental: 1, ick: 2, assignment: 'na' },
  { category: 'Cats', name: 'Refill litter', minutesPerOccurrence: 5, occurrencesPerMonth: 4, mental: 1, ick: 1, assignment: 'na' },
  { category: 'Cats', name: 'Deep clean Litter-Robot', minutesPerOccurrence: 30, occurrencesPerMonth: 1, mental: 1, ick: 2, assignment: 'na' },
  { category: 'Cats', name: 'Sweep stray litter / clean around box', minutesPerOccurrence: 5, occurrencesPerMonth: 12, mental: 0, ick: 1, assignment: 'na' },
  { category: 'Cats', name: 'Brush / play / attention', minutesPerOccurrence: 15, occurrencesPerMonth: 20, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Cats', name: 'Clean up hairballs / vomit / accidents', minutesPerOccurrence: 10, occurrencesPerMonth: 6, mental: 0, ick: 2, assignment: 'na' },
  { category: 'Cats', name: 'Vet appts + meds / flea tracking', minutesPerOccurrence: 40, occurrencesPerMonth: 1, mental: 3, ick: 0, assignment: 'na' },
  { category: 'Cats', name: 'Track & reorder cat food + litter', minutesPerOccurrence: 10, occurrencesPerMonth: 4, mental: 3, ick: 0, assignment: 'na' },
  // Plants & home
  { category: 'Plants & home', name: 'Water & tend the 3 plants', minutesPerOccurrence: 8, occurrencesPerMonth: 8, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Plants & home', name: 'Repot / prune / fertilize plants', minutesPerOccurrence: 25, occurrencesPerMonth: 1, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Plants & home', name: 'Small home repairs / handyman tasks', minutesPerOccurrence: 30, occurrencesPerMonth: 2, mental: 2, ick: 1, assignment: 'na' },
  { category: 'Plants & home', name: 'Bulbs / batteries / filters', minutesPerOccurrence: 10, occurrencesPerMonth: 2, mental: 2, ick: 0, assignment: 'na' },
  // Admin & mental load
  { category: 'Admin & mental load', name: 'Pay bills / manage finances', minutesPerOccurrence: 30, occurrencesPerMonth: 4, mental: 3, ick: 0, assignment: 'na' },
  { category: 'Admin & mental load', name: 'Schedule appointments / repairs', minutesPerOccurrence: 20, occurrencesPerMonth: 4, mental: 3, ick: 0, assignment: 'na' },
  { category: 'Admin & mental load', name: 'Book + prep for housekeeper', minutesPerOccurrence: 25, occurrencesPerMonth: 1, mental: 2, ick: 0, assignment: 'na' },
  { category: 'Admin & mental load', name: 'Mail / packages / returns', minutesPerOccurrence: 15, occurrencesPerMonth: 8, mental: 1, ick: 0, assignment: 'na' },
  { category: 'Admin & mental load', name: 'Notice & reorder supplies (TP, towels, soap, pods, toothpaste, floss)', minutesPerOccurrence: 12, occurrencesPerMonth: 8, mental: 3, ick: 0, assignment: 'na' },
  { category: 'Admin & mental load', name: 'Home maintenance tracking (detectors, filters)', minutesPerOccurrence: 20, occurrencesPerMonth: 1, mental: 2, ick: 0, assignment: 'na' },
  { category: 'Admin & mental load', name: 'Run the shared calendar / who-does-what', minutesPerOccurrence: 15, occurrencesPerMonth: 8, mental: 3, ick: 0, assignment: 'na' },
];

export function makeFreshState(): import('./types').AppState {
  return {
    screen: 'align',
    weights: { mental: 1.0, ick: 0.5 },
    align: ALIGN_QUESTIONS.map(() => ({ you: '', partner: '' })),
    tasks: DEFAULT_TASKS.map((t, i) => ({ id: `t${i}`, ...t })),
    options: Object.fromEntries(SOLUTION_OPTIONS.map(o => [o.id, false])),
    customSolutions: [],
    comments: {},
    budgetMonthly: '',
    plan: '',
  };
}
