"""
Scoring logic mirrored from src/scoring.ts.

Both sides must implement the same formula so the frontend can optimistically
compute scores without round-tripping to the API.

Formula (from spec):
  monthly_minutes = minutes_per_occurrence * occurrences_per_month
  multiplier      = (1 + weights['mental'] * (mental / 3))
                  * (1 + weights['ick']    * (ick    / 2))
  load_points     = monthly_minutes * multiplier / 10
"""

from __future__ import annotations
from dataclasses import dataclass


@dataclass
class TaskScore:
    monthly_minutes: float
    load_points: float


def score_task(task: dict, weights: dict) -> TaskScore:
    """Score a single task. task and weights are plain dicts matching AppState shape."""
    monthly_minutes = task["minutesPerOccurrence"] * task["occurrencesPerMonth"]
    multiplier = (
        (1 + weights["mental"] * (task["mental"] / 3))
        * (1 + weights["ick"] * (task["ick"] / 2))
    )
    return TaskScore(
        monthly_minutes=monthly_minutes,
        load_points=monthly_minutes * multiplier / 10,
    )


@dataclass
class ScoreSummary:
    me_points: float
    me_minutes: float
    partner_points: float
    partner_minutes: float
    outsource_points: float
    me_share_percent: float
    partner_share_percent: float
    beam_angle_deg: float


def summarize(tasks: list[dict], weights: dict) -> ScoreSummary:
    """Aggregate per-person totals. Mirrors scoring.ts summarize()."""
    me_points = me_minutes = 0.0
    partner_points = partner_minutes = 0.0
    outsource_points = 0.0

    for task in tasks:
        assignment = task.get("assignment", "na")
        if assignment == "na":
            continue

        scored = score_task(task, weights)

        if assignment == "outsource":
            outsource_points += scored.load_points
        elif assignment == "me":
            me_points += scored.load_points
            me_minutes += scored.monthly_minutes
        elif assignment == "partner":
            partner_points += scored.load_points
            partner_minutes += scored.monthly_minutes
        elif assignment == "both":
            me_points      += scored.load_points / 2
            me_minutes     += scored.monthly_minutes / 2
            partner_points += scored.load_points / 2
            partner_minutes += scored.monthly_minutes / 2

    total = me_points + partner_points
    me_share      = (me_points      / total * 100) if total > 0 else 50.0
    partner_share = (partner_points / total * 100) if total > 0 else 50.0

    share_diff = me_share - partner_share
    beam_angle = max(-9.0, min(9.0, share_diff * 0.18))

    return ScoreSummary(
        me_points=me_points,
        me_minutes=me_minutes,
        partner_points=partner_points,
        partner_minutes=partner_minutes,
        outsource_points=outsource_points,
        me_share_percent=me_share,
        partner_share_percent=partner_share,
        beam_angle_deg=beam_angle,
    )
