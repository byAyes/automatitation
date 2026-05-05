from .models import Job, ScraperResult
from .config import ScraperConfig


def __getattr__(name):
    if name == "ScraplingBaseScraper":
        from .base import ScraplingBaseScraper
        return ScraplingBaseScraper
    if name == "main":
        from .runner import main
        return main
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
