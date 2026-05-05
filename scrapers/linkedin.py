from scrapers.shared.base import ScraplingBaseScraper, run_scraper_cli
from scrapers.shared.models import Job


class LinkedInScraper(ScraplingBaseScraper):
    name = "linkedin"

    def build_url(self, query: str) -> str:
        base = (self.config.extra or {}).get("base_url", "https://www.linkedin.com/jobs/search")
        location = (self.config.extra or {}).get("location", "")
        params = f"keywords={query}"
        if location:
            params += f"&location={location}"
        return f"{base}?{params}"

    def _wait_selector(self) -> str | None:
        return ".base-card"

    def parse_page(self, page) -> list[Job]:
        jobs: list[Job] = []
        cards = page.css(".base-card")

        for card in cards:
            job = self._parse_card(card)
            if job:
                jobs.append(job)

        return jobs

    def _parse_card(self, card) -> Job | None:
        try:
            title_el = card.css(".base-search-card__title")
            company_el = card.css(".base-search-card__subtitle .hidden-nested-link")
            location_el = card.css(".job-search-card__location")
            link_el = card.css("a.base-card__full-link")

            title = title_el[0].text.strip() if title_el else ""
            company = company_el[0].text.strip() if company_el else ""
            location = location_el[0].text.strip() if location_el else ""
            link = link_el[0].attrib.get("href", "") if link_el else ""

            if not title or not company:
                return None

            return Job(
                id=self._generate_id(link),
                title=title,
                company=company,
                location=location,
                link=link,
                description="",
                source="linkedin",
            )
        except Exception as exc:
            self._log("warning", f"Error parsing card: {exc}")
            return None


if __name__ == "__main__":
    run_scraper_cli(LinkedInScraper)
