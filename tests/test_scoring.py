"""
Python scoring tests. These mirror scoring.test.ts — if the TypeScript tests
pass but these fail (or vice versa), the two implementations have diverged.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

from scoring import score_task, summarize

WEIGHTS = {"mental": 1.0, "ick": 0.5}


def task(**overrides):
    """Build a minimal task dict."""
    base = {
        "id": "t0",
        "category": "Test",
        "name": "Test task",
        "minutesPerOccurrence": 10,
        "occurrencesPerMonth": 4,
        "mental": 0,
        "ick": 0,
        "assignment": "na",
    }
    base.update(overrides)
    return base


class TestScoreTask:
    def test_no_mental_ick_multiplier_is_one(self):
        # multiplier = (1+0)*(1+0) = 1 → pts = 80/10 = 8
        s = score_task(task(minutesPerOccurrence=20, occurrencesPerMonth=4), WEIGHTS)
        assert s.monthly_minutes == 80
        assert s.load_points == 8.0

    def test_max_mental_doubles_score(self):
        # multiplier = (1 + 1.0*(3/3)) * 1 = 2 → pts = 80*2/10 = 16
        s = score_task(task(minutesPerOccurrence=20, occurrencesPerMonth=4, mental=3), WEIGHTS)
        assert s.load_points == 16.0

    def test_max_ick_adds_50_percent(self):
        # multiplier = 1 * (1 + 0.5*(2/2)) = 1.5 → pts = 80*1.5/10 = 12
        s = score_task(task(minutesPerOccurrence=20, occurrencesPerMonth=4, ick=2), WEIGHTS)
        assert s.load_points == 12.0

    def test_max_mental_and_ick_stacks_multiplicatively(self):
        # multiplier = 2 * 1.5 = 3 → pts = 100*3/10 = 30
        s = score_task(task(minutesPerOccurrence=10, occurrencesPerMonth=10, mental=3, ick=2), WEIGHTS)
        assert s.load_points == 30.0

    def test_zero_mental_weight_ignores_mental(self):
        s = score_task(
            task(minutesPerOccurrence=10, occurrencesPerMonth=10, mental=3),
            {"mental": 0, "ick": 0.5},
        )
        assert s.load_points == 10.0


class TestSummarize:
    def test_single_task_assigned_to_me(self):
        tasks = [task(assignment="me", minutesPerOccurrence=10, occurrencesPerMonth=10)]
        s = summarize(tasks, WEIGHTS)
        assert s.me_minutes == 100
        assert s.me_share_percent == 100
        assert s.partner_share_percent == 0
        assert s.beam_angle_deg == 9.0  # capped

    def test_fifty_fifty_split_beam_at_zero(self):
        tasks = [task(assignment="both", minutesPerOccurrence=10, occurrencesPerMonth=10)]
        s = summarize(tasks, WEIGHTS)
        assert s.me_share_percent == 50
        assert s.partner_share_percent == 50
        assert s.beam_angle_deg == 0.0

    def test_both_splits_50_50(self):
        tasks = [task(assignment="both", minutesPerOccurrence=20, occurrencesPerMonth=4)]
        s = summarize(tasks, WEIGHTS)
        assert s.me_minutes == 40
        assert s.partner_minutes == 40

    def test_outsource_excluded_from_personal_balance(self):
        tasks = [
            task(id="t0", assignment="outsource", minutesPerOccurrence=100, occurrencesPerMonth=10),
            task(id="t1", assignment="me", minutesPerOccurrence=10, occurrencesPerMonth=10),
        ]
        s = summarize(tasks, WEIGHTS)
        assert s.outsource_points > 0
        assert s.me_share_percent == 100  # outsource not in denominator

    def test_na_tasks_fully_excluded(self):
        tasks = [task(assignment="na", minutesPerOccurrence=999, occurrencesPerMonth=999)]
        s = summarize(tasks, WEIGHTS)
        assert s.me_points == 0
        assert s.partner_points == 0

    def test_beam_angle_capped_at_nine(self):
        tasks = [task(assignment="me", minutesPerOccurrence=1000, occurrencesPerMonth=100)]
        s = summarize(tasks, WEIGHTS)
        assert s.beam_angle_deg == 9.0
