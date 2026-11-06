/** Read-only static checks; never evaluates project code or contacts targets. */
import fs from 'node:fs/promises';
import path from 'node:path';
const SKIP = new Set(['node_modules', '.git', '.vscode', 'coverage', 'dist', 'build', '.next', 'data']);
const EXT = new Set(['.js','.mjs','.cjs','.ts','.tsx','.jsx','.py','.sol','.json','.html','.yml','.yaml','.sh']);
const MAX_FILES = 1500, MAX_FILE_BYTES = 1_000_000;
const RULES = [
  { id:'JS_EVAL', severity:'high', re:/\beval\s*\(/g, text:'Uso de eval: posible ejecución dinámica de código.' },
  { id:'DYNAMIC_FUNCTION', severity:'medium', re:/new\s+Function\s*\(/g, text:'Constructor Function: código dinámico difícil de auditar.' },
  { id:'UNSAFE_INNERHTML', severity:'medium', re:/\.innerHTML\s*=/g, text:'Asignación innerHTML: comprobar sanitización de contenido no confiable.' },
  { id:'TLS_VERIFY_DISABLED', severity:'high', re:/rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/g, text:'Validación TLS desactivada.' },
  { id:'SHELL_EXEC', severity:'high', re:/\bexec(?:Sync)?\s*\(|\bspawn(?:Sync)?\s*\([^\n]*shell\s*:\s*true/g, text:'Ejecución de comandos: revisar entrada, permisos y aislamiento.' },
  { id:'SOLIDITY_TX_ORIGIN', severity:'high', re:/\btx\.origin\b/g, text:'Contrato Solidity usa tx.origin para autorización.' },
  { id:'SOLIDITY_DELEGATECALL', severity:'high', re:/\.delegatecall\s*\(/g, text:'delegatecall: verificar destino, almacenamiento y autorización.' },
  { id:'SOLIDITY_UNCHECKED_CALL', severity:'medium', re:/\.call\s*\{[^}]*\}\s*\([^)]*\)\s*;/g, text:'Llamada low-level posiblemente sin comprobar resultado.' },
  { id:'SECRET_LIKE', severity:'high', re:/(?:PRIVATE[_ -]?KEY|MNEMONIC|SEED[_ -]?PHRASE)\s*[:=]\s*['"][^'"\s]{16,}/gi, text:'Posible secreto incrustado en código; revisar sin compartir el valor.' },
  { id:'WEAK_RANDOM', severity:'low', re:/Math\.random\s*\(/g, text:'Math.random no es apto para generación criptográfica.' }
];
async function walk(root, dir, out) {
  if (out.length >= MAX_FILES) return;
  let entries; try { entries = await fs.readdir(dir, { withFileTypes:true }); } catch { return; }
  for (const entry of entries) {
    if (out.length >= MAX_FILES) break;
    if (entry.name === '.env' || entry.name.startsWith('.env.') || /^(?:keypair|id_rsa|wallet-seed)/i.test(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!SKIP.has(entry.name)) await walk(root, full, out); }
    else if (entry.isFile() && EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
}
export async function runStaticSecurityAudit(root) {
  const files = []; await walk(root, root, files);
  const findings = []; let scannedFiles = 0;
  for (const file of files) {
    let stat; try { stat = await fs.stat(file); } catch { continue; }
    if (stat.size > MAX_FILE_BYTES) continue;
    let source; try { source = await fs.readFile(file, 'utf8'); } catch { continue; }
    scannedFiles++;
    const lines = source.split(/\r?\n/);
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      for (let i=0; i<lines.length; i++) {
        if (rule.re.test(lines[i])) {
          findings.push({ ruleId:rule.id, severity:rule.severity, file:path.relative(root,file).split(path.sep).join('/'), line:i+1, message:rule.text });
          if (findings.length >= 500) break;
        }
        rule.re.lastIndex = 0;
      }
      if (findings.length >= 500) break;
    }
    if (findings.length >= 500) break;
  }
  const counts = { high:0, medium:0, low:0 };
  for (const f of findings) counts[f.severity]++;
  return { ok:true, mode:'STATIC_READ_ONLY', scannedFiles, findingsCount:findings.length, counts, findings, truncated:findings.length>=500, scannedAt:new Date().toISOString(), disclaimer:'Heurístico; no sustituye auditoría profesional ni análisis dinámico. No se ejecutó código.' };
}
