from typing import Any

from app.models import Investigation

_SCORE_BY_INDEPENDENT_COUNT = {0: 0, 1: 40, 2: 65, 3: 82}


def calculate_independent_confirmation(investigation: Investigation) -> dict[str, Any]:
    relationships = investigation.source_relationships

    independent_urls = {r.url for r in relationships if r.is_independent}
    independent_count = len(independent_urls)
    total_count = len(relationships)

    if independent_count in _SCORE_BY_INDEPENDENT_COUNT:
        score = _SCORE_BY_INDEPENDENT_COUNT[independent_count]
    else:
        score = min(100, 82 + (independent_count - 3) * 6)

    return {
        "score": score,
        "independent_count": independent_count,
        "total_count": total_count,
        "relationships": [r.model_dump() for r in relationships],
    }
