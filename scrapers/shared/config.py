from dataclasses import dataclass
from typing import Optional


@dataclass
class ScraperConfig:
    query: str = ""
    max_jobs: int = 10
    rate_limit_ms: int = 5000
    scraper_name: str = ""
    extra: Optional[dict] = None

    @classmethod
    def from_dict(cls, d: dict) -> "ScraperConfig":
        return cls(
            query=d.get("query", ""),
            max_jobs=d.get("maxJobs", 10),
            rate_limit_ms=d.get("rateLimitMs", 5000),
            scraper_name=d.get("scraperName", ""),
            extra=d.get("extra"),
        )
