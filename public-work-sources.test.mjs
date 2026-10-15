import test from 'node:test';
import assert from 'node:assert/strict';
import { listPaidWorkSources, discoverPublicWork } from '../server/public-work-sources.js';

test('work source catalogue distinguishes listings from payment APIs', () => {
  const sources = listPaidWorkSources();
  assert.ok(sources.some(source => source.id === 'arbeitnow' && source.mode === 'READ_ONLY_DISCOVERY'));
  assert.ok(sources.some(source => source.id === 'remotive' && source.mode === 'READ_ONLY_DISCOVERY'));
  assert.ok(sources.some(source => source.id === 'jobicy' && source.mode === 'READ_ONLY_DISCOVERY'));
  assert.ok(sources.some(source => source.id === 'hackerone' && source.mode === 'HUMAN_RESEARCH_ONLY'));
  assert.ok(sources.some(source => source.id === 'gitcoin' && source.mode === 'MANUAL_BOUNTY_REVIEW'));
  assert.ok(sources.every(source => source.url.startsWith('https://')));
});

test('Jobicy is listed as discovery only, not as a guaranteed payout provider', () => {
  const jobicy = listPaidWorkSources().find(source => source.id === 'jobicy');
  assert.ok(jobicy);
  assert.equal(jobicy.mode, 'READ_ONLY_DISCOVERY');
  assert.match(jobicy.payment, /not a task-payout API/i);
});


test('public discovery normalizes Jobicy listings as leads, never as verified income', async t => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    const u = String(url);
    if (u.includes('arbeitnow.com')) return new Response(JSON.stringify({ data: [] }), { status: 200 });
    if (u.includes('remotive.com')) return new Response(JSON.stringify({ jobs: [] }), { status: 200 });
    if (u.includes('jobicy.com')) return new Response(JSON.stringify({ jobs: [{ id: 77, url: 'https://jobicy.com/jobs/77-demo', jobTitle: 'Remote QA Engineer', companyName: 'Demo Co', jobGeo: 'Europe', jobExcerpt: 'Test systems', jobType: ['Contract'], salaryMin: 30, salaryMax: 40, salaryCurrency: 'EUR', salaryPeriod: 'hourly', pubDate: '2026-10-14T10:00:00Z' }] }), { status: 200 });
    throw new Error('unexpected_url');
  };
  t.after(() => { globalThis.fetch = oldFetch; });
  const result = await discoverPublicWork({ query: 'qa', remoteOnly: true, limit: 10 });
  assert.equal(result.ok, true);
  assert.equal(result.jobs.length, 1);
  assert.equal(result.jobs[0].source, 'jobicy');
  assert.equal(result.jobs[0].economicStatus, 'LEAD_ONLY_REQUIRES_HUMAN_REVIEW');
  assert.equal(result.accountingEffect, 'NONE');
});
