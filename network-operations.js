import { boundedFetchJson, networkAllowlist } from './network-sandbox.js';
import { runStaticSecurityAudit } from './security-audit.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const state = { startedAt:new Date().toISOString(), lastTask:null, tasks:[], lastSearch:null, lastJobs:null, lastAudit:null, lastGitHubSearch:null };
function record(type, status, details = {}) {
  const item = { id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`, type, status, at:new Date().toISOString(), ...details };
  state.lastTask = item; state.tasks.unshift(item); state.tasks = state.tasks.slice(0, 30); return item;
}
export function getNetworkOperationsStatus() {
  return { ok:true, mode:'BOUNDED_NETWORK_READ_ONLY', allowlist:networkAllowlist(), sandbox:{ httpsOnly:true, redirects:false, maxResponseBytes:1000000, timeoutMs:8000, privateAddressesBlocked:true, arbitraryUrlsAccepted:false }, lastTask:state.lastTask, recentTasks:state.tasks, lastSearchAt:state.lastSearch?.checkedAt || null, lastJobsAt:state.lastJobs?.checkedAt || null, lastAuditAt:state.lastAudit?.scannedAt || null, lastGitHubSearchAt:state.lastGitHubSearch?.checkedAt || null, startupAt:state.startedAt };
}
export async function searchPublicWeb(query) {
  const q = String(query || '').trim().slice(0, 160);
  if (q.length < 2) throw new Error('SEARCH_QUERY_TOO_SHORT');
  const started = Date.now(); record('web-search','RUNNING',{ query:q });
  try {
    const url = new URL('https://api.duckduckgo.com/'); url.searchParams.set('q',q); url.searchParams.set('format','json'); url.searchParams.set('no_html','1'); url.searchParams.set('no_redirect','1'); url.searchParams.set('skip_disambig','1');
    const data = await boundedFetchJson(url.toString());
    const results = [];
    const add = item => { if (item?.FirstURL && item?.Text && results.length < 20) results.push({ title:String(item.Text).slice(0,220), url:String(item.FirstURL), source:'DuckDuckGo Instant Answer' }); };
    for (const item of data.RelatedTopics || []) { if (item.Topics) item.Topics.forEach(add); else add(item); }
    if (data.AbstractURL && data.AbstractText) results.unshift({ title:String(data.Heading || data.AbstractText).slice(0,220), url:String(data.AbstractURL), source:String(data.AbstractSource || 'DuckDuckGo') });
    state.lastSearch = { query:q, results, checkedAt:new Date().toISOString(), provider:'DuckDuckGo Instant Answer API', note:'API de respuestas instantáneas; no equivale a un índice web exhaustivo.' };
    record('web-search','SUCCEEDED',{ query:q, resultCount:results.length, durationMs:Date.now()-started }); return state.lastSearch;
  } catch (error) { record('web-search','FAILED',{ query:q, code:String(error?.message || 'SEARCH_FAILED').slice(0,100), durationMs:Date.now()-started }); throw error; }
}

export async function searchGitHubSolutions(query) {
  const q = String(query || '').trim().slice(0,160);
  if (q.length < 2) throw new Error('GITHUB_QUERY_TOO_SHORT');
  const started=Date.now(); record('github-solutions-search','RUNNING',{query:q});
  try {
    const url=new URL('https://api.github.com/search/repositories');
    url.searchParams.set('q',q); url.searchParams.set('sort','stars'); url.searchParams.set('order','desc'); url.searchParams.set('per_page','10');
    const data=await boundedFetchJson(url.toString());
    const results=(data.items||[]).slice(0,10).map(item=>({name:String(item.full_name||'').slice(0,180),description:String(item.description||'').slice(0,500),url:String(item.html_url||''),language:item.language||null,stars:Number(item.stargazers_count||0),updatedAt:item.updated_at||null,source:'GitHub repository search'})).filter(item=>item.name&&item.url.startsWith('https://github.com/'));
    state.lastGitHubSearch={query:q,results,count:results.length,checkedAt:new Date().toISOString(),note:'Repositorios públicos como pistas técnicas; popularidad no garantiza seguridad ni calidad.'};
    record('github-solutions-search','SUCCEEDED',{query:q,resultCount:results.length,durationMs:Date.now()-started});
    return state.lastGitHubSearch;
  } catch(error) { record('github-solutions-search','FAILED',{query:q,code:String(error?.message||'GITHUB_SEARCH_FAILED').slice(0,100),durationMs:Date.now()-started}); throw error; }
}

export async function searchJobOpportunities(query = '') {
  const q = String(query || '').trim().slice(0,120).toLowerCase();
  const started = Date.now(); record('job-search','RUNNING',{ query:q });
  try {
    const [remotive, arbeitnow] = await Promise.allSettled([
      boundedFetchJson(`https://remotive.com/api/remote-jobs?limit=100${q ? `&search=${encodeURIComponent(q)}` : ''}`),
      boundedFetchJson('https://www.arbeitnow.com/api/job-board-api')
    ]);
    const results = [];
    if (remotive.status === 'fulfilled') for (const j of (remotive.value.jobs || [])) results.push({ id:`remotive:${j.id}`, title:j.title, company:j.company_name, location:j.candidate_required_location || 'Remote', url:j.url, source:'Remotive', publishedAt:j.publication_date || null, tags:(j.tags || []).slice(0,8) });
    if (arbeitnow.status === 'fulfilled') for (const j of (arbeitnow.value.data || [])) results.push({ id:`arbeitnow:${j.slug || j.url}`, title:j.title, company:j.company_name, location:j.location || 'No especificada', url:j.url, source:'Arbeitnow', publishedAt:j.created_at || null, tags:(j.tags || []).slice(0,8) });
    const filtered = results.filter(j => j.title && j.url && (!q || `${j.title} ${j.company} ${j.location} ${(j.tags||[]).join(' ')}`.toLowerCase().includes(q)));
    const deduped = [...new Map(filtered.map(j => [j.url,j])).values()].slice(0,60);
    const failures = [remotive,arbeitnow].filter(x=>x.status==='rejected').length;
    state.lastJobs = { query:q, results:deduped, count:deduped.length, sources:{ remotive:remotive.status==='fulfilled', arbeitnow:arbeitnow.status==='fulfilled' }, checkedAt:new Date().toISOString(), note:'Oportunidades públicas orientativas. No se presentan candidaturas, no se contacta a empleadores y no se garantiza remuneración.' };
    record('job-search',deduped.length || failures===2 ? (failures===2?'FAILED':'SUCCEEDED') : 'SUCCEEDED',{ query:q, resultCount:deduped.length, sourceFailures:failures, durationMs:Date.now()-started });
    if (failures===2) throw new Error('JOB_SOURCES_UNAVAILABLE');
    return state.lastJobs;
  } catch (error) { if (error?.message !== 'JOB_SOURCES_UNAVAILABLE') record('job-search','FAILED',{ query:q, code:String(error?.message || 'JOB_SEARCH_FAILED').slice(0,100), durationMs:Date.now()-started }); throw error; }
}
export async function performStaticAudit() {
  const started=Date.now(); record('security-audit','RUNNING');
  try { const result=await runStaticSecurityAudit(root); state.lastAudit=result; record('security-audit','SUCCEEDED',{ scannedFiles:result.scannedFiles, findingsCount:result.findingsCount, durationMs:Date.now()-started }); return result; }
  catch(error) { record('security-audit','FAILED',{ code:String(error?.message||'AUDIT_FAILED').slice(0,100), durationMs:Date.now()-started }); throw error; }
}
export async function startupEndpointCheck(baseUrl) {
  const paths=['/healthz','/api/neon-orb/operations/status','/api/neon-orb/network/status','/api/neon-orb/agent/status'];
  const checks=[];
  for (const endpoint of paths) {
    try { const response=await fetch(new URL(endpoint,baseUrl),{ signal:AbortSignal.timeout(2500), redirect:'error' }); checks.push({ endpoint, ok:response.ok, status:response.status }); }
    catch { checks.push({ endpoint, ok:false, status:null }); }
  }
  record('startup-endpoint-check',checks.every(c=>c.ok)?'SUCCEEDED':'PARTIAL',{ checks });
  return checks;
}
