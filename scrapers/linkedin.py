from scrapers.shared.base import ScraplingBaseScraper, run_scraper_cli
from scrapers.shared.models import Job
import traceback


class LinkedInScraper(ScraplingBaseScraper):
    name = "linkedin"

    def __init__(self, config):
        super().__init__(config)
        self.max_retries = 2
        self.base_backoff = 10

    def build_url(self, query: str) -> str:
        base = (self.config.extra or {}).get("base_url", "https://www.linkedin.com/jobs/search")
        location = (self.config.extra or {}).get("location", "")
        params = f"keywords={query}&f_TPR=r2592000"  # Past 30 days
        if location:
            params += f"&location={location}"
        return f"{base}?{params}"

    def _wait_selector(self) -> str | None:
        return None  # Don't wait for a specific selector, rely on network_idle

    def _fetcher_options(self) -> dict:
        return {"network_idle": True, "wait": 10000, "timeout": 60000}

    def parse_page(self, page) -> list[Job]:
        jobs: list[Job] = []

        # Debug: try to extract all visible text
        body = page.css("body")
        if body and body[0].text:
            text_content = body[0].text[:2000]
            self._log("info", f"Page body text (first 2000 chars): {text_content}")

        # Debug: try to find ALL elements with href attributes (links)
        all_links = page.css("a[href]")
        self._log("info", f"Total links on page: {len(all_links)}")
        for link in all_links[:20]:
            href = link.attrib.get("href", "")
            text = (link.text or "")[:80]
            if "job" in href.lower() or "job" in text.lower():
                self._log("info", f"Job-related link: href='{href[:150]}' text='{text}'")

        # Try to find any job-related content with broad selectors
        for test_sel in [
            "a[href*='/jobs/view']",
            "[data-occludable-job-id]",
            "[class*='job']",
            "[class*='Job']",
            "[class*='JOB']",
            "article",
            "section",
        ]:
            found = page.css(test_sel)
            if found:
                self._log("info", f"Found {len(found)} elements with selector '{test_sel}'")
                if found[0].text:
                    self._log("info", f"  First match text: {found[0].text[:100]}")

        # Use the most generic approach: find all list items that contain job links
        job_candidates = []
        all_list_items = page.css("li")
        self._log("info", f"Total <li> elements: {len(all_list_items)}")

        for li in all_list_items:
            links = li.css("a[href*='/jobs/view']")
            if links:
                job_candidates.append(li)

        if job_candidates:
            self._log("info", f"Found {len(job_candidates)} list items with job view links")
            for el in job_candidates:
                job = self._parse_card(el)
                if job:
                    jobs.append(job)
        else:
            self._log("warning", "No job candidates found via <li> approach, trying generic card selectors")

            # Even more generic: find anything that looks like a card
            for sel in [
                "a[href*='/jobs/view']",
                "[class*='card']",
                "[class*='result']",
                "div[class]",
            ]:
                elements = page.css(sel)
                if elements and len(elements) > 5:  # At least some results
                    self._log("info", f"Trying selector: {sel} ({len(elements)} elements)")
                    for el in elements[:30]:
                        link_els = el.css("a[href]")
                        if link_els:
                            href = link_els[0].attrib.get("href", "")
                            text = (el.text or "").strip()
                            if len(text) > 20 and ("job" in href.lower() or "job" in text.lower()):
                                self._log("info", f"  Candidate: text='{text[:80]}' href='{href[:100]}'")
                                job = self._parse_card(el)
                                if job:
                                    jobs.append(job)

        return jobs

    def _parse_card(self, el) -> Job | None:
        try:
            # Title
            title = ""
            for sel in [
                "a[href*='/jobs/view']",
                "a[class*='title']",
                "a[class*='job']",
                "strong",
                "h3",
                "a span",
                "[class*='title']",
                "[class*='heading']",
            ]:
                found = el.css(sel)
                if found and found[0].text:
                    title = found[0].text.strip()
                    if len(title) > 3:
                        break

            if not title or len(title) < 3:
                return None

            # Company
            company = ""
            for sel in [
                "[class*='company']",
                "[class*='Company']",
                "[class*='employer']",
                "[class*='org']",
                "span[class*='name']",
            ]:
                found = el.css(sel)
                if found and found[0].text:
                    company = found[0].text.strip()
                    if len(company) > 1:
                        break

            # Location
            location = ""
            for sel in [
                "[class*='location']",
                "[class*='Location']",
                "[class*='metadata']",
                "span[class*='loc']",
                "li[class*='metadata']",
            ]:
                found = el.css(sel)
                if found and found[0].text:
                    location = found[0].text.strip()
                    break

            # Link
            link = ""
            for sel in [
                "a[href*='/jobs/view']",
                "a[href*='linkedin.com/jobs']",
                "a[href*='linkedin']",
                "a",
            ]:
                found = el.css(sel)
                if found:
                    link = found[0].attrib.get("href", "")
                    if link:
                        break

            if link and not link.startswith("http"):
                link = f"https://www.linkedin.com{link}"

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
