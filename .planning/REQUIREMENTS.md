# GSD Requirements: Automation CV Web Portal

## Overview
Expand existing job-email-automation to add CV web portal while keeping weekly emails.

## Requirements

### P0 (MUST)
- [ ] Frontend HTML page for CV upload/form
- [ ] CV parsing (extract name, email, skills from PDF/DOCX)
- [ ] Manual job filtering UI (search/filters)
- [ ] Keep existing weekly email automation
- [ ] Gmail OAuth2 configured and working

### P1 (SHOULD)
- [ ] Display scraped jobs in web UI
- [ ] Edit job matching criteria (skills, location, salary)
- [ ] Manual trigger for immediate scrape
- [ ] Log view/email history in portal

### P2 (COULD)
- [ ] Multiple CV versions
- [ ] Advanced NLP for skill extraction
- [ ] Job application tracking
- [ ] Export matches to CSV/JSON

## Non-requirements
- Multi-user authentication
- Advanced resume writing assistance
- Transactional application system

## Success criteria
- User can upload CV and see matched jobs
- Weekly emails continue sending
- Manual actions work (filter, search)
- No crashes or data loss
