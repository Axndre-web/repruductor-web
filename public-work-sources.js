const SOURCES = [
  {
    id: 'arbeitnow', name: 'Arbeitnow', type: 'PUBLIC_JOB_FEED', free: true,
    url: 'https://www.arbeitnow.com', api: 'https://www.arbeitnow.com/api/job-board-api',
    mode: 'READ_ONLY_DISCOVERY', payment: 'Employer pays if hired; not a task-payout API',
    note: 'Public job listings; application is performed by the applicant. Attribution/link back required.'
  },
  {
    id: 'remotive', name: 'Remotive', type: 'PUBLIC_JOB_FEED', free: true,
    url: 'https://remotive.com', api: 'https://remotive.com/api/remote-jobs',
    mode: 'READ_ONLY_DISCOVERY', payment: 'Employer pays if hired; not a task-payout API',
    note: 'Public remote-job feed; poll at most four times daily and link to Remotive and the original listing.'
  },
  {
    id: 'jobicy', name: 'Jobicy', type: 'PUBLIC_JOB_FEED', free: true,
    url: 'https://jobicy.com/jobs-rss-feed', api: 'https://jobicy.com/api/v2/remote-jobs',
    mode: 'READ_ONLY_DISCOVERY', payment: 'Employer pays if hired; not a task-payout API',
    note: 'Public remote jobs API; preserve canonical Jobicy listing URL and poll no more than hourly.'
  },
  {
    id: 'toloka', name: 'Toloka', type: 'TASK_MARKETPLACE', free: true,
    url: 'https://toloka.ai/get-started', api: 'https://platform.toloka.ai/docs/integration/programmatic-access/',
    mode: 'ACCOUNT_REQUIRED_NOT_CONNECTED', payment: 'Eligible tasks may pay after platform acceptance and payout setup',
    note: 'The documented API is primarily for requester/customer workflows; worker task access and eligibility depend on the account.'
  },
  {
    id: 'gitcoin', name: 'Gitcoin', type: 'BOUNTY_MARKETPLACE', free: true,
    url: 'https://gitcoin.co/mechanisms/bounties', api: 'https://gitcoin.co/mechanisms/bounties',
    mode: 'MANUAL_BOUNTY_REVIEW', payment: 'Reward is released according to bounty terms after accepted deliverables; no payout guaranteed',
    note: 'Bounty marketplace catalog entry only; no API claiming, submission, or payment signing is enabled.'
  },
  {
    id: 'hackerone', name: 'HackerOne', type: 'BOUNTY_MARKETPLACE', free: true,
    url: 'https://www.hackerone.com', api: 'https://docs.hackerone.com/en/articles/8395720-payment-preferences',
    mode: 'HUMAN_RESEARCH_ONLY', payment: 'Bounties only for valid reports accepted by a program; payout setup and identity checks required',
    note: 'No automatic scanning, exploitation, or submission is enabled. Follow each program scope and rules.'
  },
  {
    id: 'upwork', name: 'Upwork', type: 'FREELANCE_MARKETPLACE', free: true,
    url: 'https://www.upwork.com', api: 'https://support.upwork.com/hc/en-us/articles/43342677368467-Use-bots-and-other-automation-properly',
    mode: 'ACCOUNT_REQUIRED_NOT_CONNECTED', payment: 'Client contract and platform payment protection required',
    note: 'Automated bots/scraping are restricted; API use requires approval. No scraping or automated applications.'
  }
];

// Remotive recommends at most four requests/day; a six-hour default enforces that cadence.
const CACHE_TTL_MS = Math.max(21_600_000, Number(process.env.NEON_JOB_FEED_CACHE_MS || 21_600_000));
const cache = new Map();
const clean = (value, max = 500) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim().slice(0, max);
const isHttpUrl = value => { try { const u = new URL(value); return u.protocol === 'https:'; } catch { return false; } };

function normalizeArbeitnow(item) {
  const url = String(item.url || '');
  if (!isHttpUrl(url)) return null;
  return {
    id: `arbeitnow:${clean(item.slug || url, 180)}`,
    source: 'arbeitnow', sourceName: 'Arbeitnow', sourceUrl: 'https://www.arbeitnow.com',
    title: clean(item.title, 180), company: clean(item.company_name, 160), location: clean(item.location, 160),
    remote: Boolean(item.remote), employmentType: clean((item.job_types || []).join(', '), 120),
    description: clean(item.description, 700), tags: Array.isArray(item.tags) ? item.tags.slice(0, 12).map(x => clean(x, 60)) : [],
    listingUrl: url, publishedAt: item.created_at || null, payDisclosure: 'PAY_NOT_VERIFIED',
    economicStatus: 'LEAD_ONLY_REQUIRES_HUMAN_REVIEW', autoApply: false
  };
}
function normalizeJobicy(item) {
  const url = String(item.url || '');
  if (!isHttpUrl(url)) return null;
  const salary = [item.salaryMin, item.salaryMax].some(v => Number.isFinite(Number(v)) && Number(v) > 0)
    ? `${item.salaryMin ?? ''}${item.salaryMin && item.salaryMax ? '–' : ''}${item.salaryMax ?? ''} ${clean(item.salaryCurrency, 12)} ${clean(item.salaryPeriod, 24)}`.trim()
    : '';
  return {
    id: `jobicy:${clean(item.id || url, 180)}`, source: 'jobicy', sourceName: 'Jobicy', sourceUrl: 'https://jobicy.com',
    title: clean(item.jobTitle, 180), company: clean(item.companyName, 160), location: clean(item.jobGeo, 160),
    remote: true, employmentType: clean((item.jobType || []).join(', '), 120),
    description: clean(item.jobExcerpt || item.jobDescription, 700),
    tags: Array.isArray(item.jobIndustry) ? item.jobIndustry.slice(0, 12).map(x => clean(x, 60)) : [],
    listingUrl: url, publishedAt: item.pubDate || null, salaryText: salary,
    payDisclosure: salary ? 'SALARY_TEXT_UNVERIFIED' : 'PAY_NOT_DISCLOSED',
    economicStatus: 'LEAD_ONLY_REQUIRES_HUMAN_REVIEW', autoApply: false
  };
}

function normalizeRemotive(item) {
  const url = String(item.url || '');
  if (!isHttpUrl(url)) return null;
  return {
    id: `remotive:${clean(item.id || url, 180)}`,
    source: 'remotive', sourceName: 'Remotive', sourceUrl: 'https://remotive.com',
    title: clean(item.title, 180), company: clean(item.company_name, 160), location: clean(item.candidate_required_location, 160),
    remote: true, employmentType: clean(item.job_type, 120),
    description: clean(item.description, 700), tags: Array.isArray(item.tags) ? item.tags.slice(0, 12).map(x => clean(x, 60)) : [],
    listingUrl: url, publishedAt: item.publication_date || null, salaryText: clean(item.salary, 120),
    payDisclosure: item.salary ? 'SALARY_TEXT_UNVERIFIED' : 'PAY_NOT_DISCLOSED',
    economicStatus: 'LEAD_ONLY_REQUIRES_HUMAN_REVIEW', autoApply: false
  };
}
async function getJson(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'NeonPlayerX-OpportunityDiscovery/1.0 (read-only; attribution enabled)' }, signal: controller.signal });
    if (!response.ok) throw new Error(`FEED_HTTP_${response.status}`);
    const data = await response.json();
    cache.set(url, { at: Date.now(), value: data });
    return data;
  } finally { clearTimeout(timer); }
}

export function listPaidWorkSources() { return SOURCES.map(source => ({ ...source })); }

/**
 * Discover public job listings only. Listings are leads, not guaranteed paid tasks.
 * This adapter intentionally never applies, accepts work, runs code, or records revenue.
 */
export async function discoverPublicWork({ query = '', remoteOnly = false, limit = 30 } = {}) {
  const q = clean(query, 100).toLowerCase();
  const max = Math.min(60, Math.max(1, Number(limit) || 30));
  const errors = [];
  const jobs = [];
  const feeds = [
    { id: 'arbeitnow', url: 'https://www.arbeitnow.com/api/job-board-api', read: async () => {
      const data = await getJson('https://www.arbeitnow.com/api/job-board-api');
      return (Array.isArray(data.data) ? data.data : []).map(normalizeArbeitnow).filter(Boolean);
    } },
    { id: 'remotive', url: 'https://remotive.com/api/remote-jobs', read: async () => {
      const data = await getJson('https://remotive.com/api/remote-jobs');
      return (Array.isArray(data.jobs) ? data.jobs : []).map(normalizeRemotive).filter(Boolean);
    } },
    { id: 'jobicy', url: 'https://jobicy.com/api/v2/remote-jobs?count=100&geo=europe', read: async () => {
      const data = await getJson('https://jobicy.com/api/v2/remote-jobs?count=100&geo=europe');
      return (Array.isArray(data.jobs) ? data.jobs : []).map(normalizeJobicy).filter(Boolean);
    } }
  ];
  const results = await Promise.allSettled(feeds.map(async feed => ({ id: feed.id, jobs: await feed.read() })));
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'rejected') { errors.push({ source: feeds[i].id, error: clean(result.reason?.message || 'feed_unavailable', 180) }); continue; }
    for (const job of result.value.jobs) {
      if (remoteOnly && !job.remote) continue;
      const haystack = `${job.title} ${job.company} ${job.location} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
      if (q && !haystack.includes(q)) continue;
      jobs.push(job);
    }
  }
  const unique = [...new Map(jobs.map(job => [job.id, job])).values()];
  unique.sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  return {
    ok: true, identity: 'NEON_ORB', mode: 'READ_ONLY_JOB_DISCOVERY', queriedAt: new Date().toISOString(),
    count: Math.min(max, unique.length), totalMatched: unique.length, jobs: unique.slice(0, max), errors,
    accountingEffect: 'NONE', note: 'Estas ofertas son pistas laborales. No garantizan remuneración ni equivalen a ingresos; la solicitud, aceptación, entrega y cobro deben verificarse por separado.'
  };
}
