from typing import Any

from app.models import Investigation


def calculate_confidence(
    investigation: Investigation,
    source_count: int,
) -> dict[str, Any]:
    score = 40
    factors: list[dict[str, int | str]] = []
    limitations: list[str] = []

    official = investigation.official_confirmation
    supporting_count = len(investigation.supporting_evidence)
    contradicting_count = len(investigation.contradicting_evidence)

    if official.found:
        score += 25
        factors.append({
            "label": "Relevant official evidence found",
            "impact": 25,
        })
    else:
        score -= 10
        factors.append({
            "label": "No official evidence found",
            "impact": -10,
        })
        limitations.append(
            "No direct official or primary confirmation was found."
        )

    if supporting_count >= 2:
        score += 15
        factors.append({
            "label": "Multiple supporting evidence items",
            "impact": 15,
        })
    elif supporting_count == 1:
        score += 8
        factors.append({
            "label": "One supporting evidence item",
            "impact": 8,
        })
        limitations.append(
            "Only one strong supporting evidence item was identified."
        )
    else:
        limitations.append(
            "No strong supporting evidence was identified."
        )

    if source_count >= 6:
        score += 10
        factors.append({
            "label": "Broad multi-source investigation",
            "impact": 10,
        })
    elif source_count >= 3:
        score += 6
        factors.append({
            "label": "Multiple sources reviewed",
            "impact": 6,
        })
        limitations.append(
            "Source coverage was useful but not exhaustive."
        )
    else:
        score -= 15
        factors.append({
            "label": "Very limited source coverage",
            "impact": -15,
        })
        limitations.append(
            "The investigation relied on a limited number of sources."
        )

    if supporting_count > 0 and contradicting_count > 0:
        score += 5
        factors.append({
            "label": "Both sides of the claim were examined",
            "impact": 5,
        })

    if contradicting_count >= 3:
        score -= 8
        factors.append({
            "label": "Several material conflicts remain",
            "impact": -8,
        })
        limitations.append(
            "Several material conflicts remain unresolved."
        )

    if contradicting_count == 0:
        limitations.append(
            "No significant conflicting evidence was found, but absence of conflict does not prove complete certainty."
        )

    if len(investigation.timeline) < 2:
        limitations.append(
            "The available timeline is limited."
        )

    if not limitations:
        limitations.append(
            "Live web information can still change as new evidence appears."
        )

    score = max(0, min(100, score))

    return {
        "score": score,
        "factors": factors,
        "limitations": limitations[:3],
    }