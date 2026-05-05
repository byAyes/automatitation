from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional


@dataclass
class Job:
    id: str = ""
    title: str = ""
    company: str = ""
    location: str = ""
    link: str = ""
    description: str = ""
    source: str = ""
    scraped_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        d = asdict(self)
        d["scrapedAt"] = d.pop("scraped_at")
        return d


@dataclass
class ScraperResult:
    success: bool
    data: Optional[list[dict]] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return {"success": self.success, "data": self.data, "error": self.error}
