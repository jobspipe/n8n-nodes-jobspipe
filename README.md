# @jobspipe/n8n-nodes-jobspipe

![The JobsPipe node in an n8n workflow: a schedule trigger, JobsPipe Search jobs returning 50 items, and Google Sheets](https://raw.githubusercontent.com/jobspipe/n8n-nodes-jobspipe/main/images/n8n.webp)

This is an n8n community node for [JobsPipe](https://jobspipe.dev). It lets your workflows search live job postings, look up companies and detect the technologies a website runs.

JobsPipe collects job postings from 30+ job boards, public employment services and company career sites and normalizes them into one schema. That makes it useful for sales signals (who is hiring for what), recruiting, job boards and market research.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Credits](#credits) · [Examples](#example-workflows) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n docs: in n8n, open **Settings → Community Nodes → Install** and enter `@jobspipe/n8n-nodes-jobspipe`.

## Credentials

1. Sign up at [jobspipe.dev](https://jobspipe.dev/signup). The free plan includes credits to try every operation.
2. Create an API key in the [dashboard](https://jobspipe.dev/dashboard) under **Settings → API Keys**. It starts with `jp_live_`.
3. In n8n, create a **JobsPipe API** credential and paste the key. n8n checks it by calling `GET /v1/account`, which costs nothing.

## Operations

| Resource | Operation | What it does |
|---|---|---|
| Job | Search | Search live job postings by title, country, city, remote, seniority, age, discovery time and minimum salary. Any other [documented filter](https://docs.jobspipe.dev/api-reference/filters) can be added as JSON in **Additional Filters**. |
| Job | Get | Get one or more postings by ID, whether still open or closed. |
| Company | Get | A company profile (size, location, industry, links) by domain or name. |
| Company | Get Tech Stack | The technologies a company's job postings show it uses, graded by evidence. |
| Company | Search by Technology | Companies whose job postings show they use a technology, filtered by country and size. |
| Website | Scan Tech Stack | The technologies a website serves (frameworks, analytics, CDNs, payments, widgets). |

![A job search request and its results: data engineer jobs in the US with company, location, salary and technologies](https://raw.githubusercontent.com/jobspipe/n8n-nodes-jobspipe/main/images/search.webp)

![A website stack scan of stripe.com listing the detected technologies and how each was detected](https://raw.githubusercontent.com/jobspipe/n8n-nodes-jobspipe/main/images/scan.webp)

Each result becomes its own n8n item. **Return All** follows the API's cursor across pages and stops at **Max Results** (default 100), so a run never spends more credits than you allow. Turn on **Options → Include Response Metadata** to get the credits charged and totals on each item.

The node can also be used as a tool by n8n's AI Agent.

## Credits

| Operation | Cost |
|---|---|
| Job Search, Job Get | 1 credit per job returned. A job already paid for this month is free. An empty result costs nothing. |
| Include Technologies option | +1 credit per returned job that names a technology |
| Company Get, Get Tech Stack | 1 credit per call |
| Company Search by Technology | 1 credit per company returned |
| Website Scan Tech Stack | 1 credit per call |

Rejected keys (401), exhausted credits (402) and rate limits (429) cost nothing. See [pricing](https://jobspipe.dev/pricing).

## Example workflows

**Daily job feed to Google Sheets.** Schedule Trigger (every morning) → JobsPipe *Job Search* (Job Titles `data engineer`, Countries `US`, Posted Within Days `1`, Return All, Max Results `200`) → Google Sheets *Append Row*.

**Enrich a list of domains with their tech stack.** Google Sheets *Get Rows* (a column of domains) → JobsPipe *Website Scan Tech Stack* (Domain `{{ $json.domain }}`) → Aggregate → Google Sheets *Update Row*.

Ready-made templates are on the [n8n integration page](https://docs.jobspipe.dev/integrations/n8n) of the JobsPipe docs.

## Compatibility

Built with `@n8n/node-cli` and tested on n8n 2.40. It needs n8n 1.x or later.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [JobsPipe API documentation](https://docs.jobspipe.dev)
- [JobsPipe search filters](https://docs.jobspipe.dev/api-reference/filters)

## Version history

### 0.1.0

First release: Job (Search, Get), Company (Get, Get Tech Stack, Search by Technology) and Website (Scan Tech Stack).
