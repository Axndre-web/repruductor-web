import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('control center prioritizes holographic topology and collapses repetitive diagnostics by default', () => {
  const js = fs.readFileSync('public/UI/unified-control-center.js', 'utf8');
  assert.match(js, /HOLOGRAPHIC/);
  assert.match(js, /data-neo-diagnostics/);
  assert.match(js, /<details class="neo-cc-diagnostics"/);
  assert.match(js, /neo-cc-command-rail/);
  assert.doesNotMatch(js, /MÓDULOS <em>VIVOS<\/em>/);
});

test('control center polish keeps source/served copies synchronized and respects reduced motion', () => {
  assert.equal(fs.readFileSync('UI/unified-control-center.js', 'utf8'), fs.readFileSync('public/UI/unified-control-center.js', 'utf8'));
  assert.equal(fs.readFileSync('UI/unified-control-center.css', 'utf8'), fs.readFileSync('public/UI/unified-control-center.css', 'utf8'));
  const css = fs.readFileSync('public/UI/unified-control-center.css', 'utf8');
  assert.match(css, /neo-map-scan/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /neo-cc-diagnostics/);
});

test('human navigation stays focused while internal modules remain in the document for NEON ORB', () => {
  for (const file of ['index.html', 'public/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /href="#inicio"/);
    assert.match(html, /href="#radio"/);
    assert.match(html, /href="#control"/);
    assert.match(html, /href="#temas"/);
    assert.match(html, /href="#slot-zone"/);
    assert.doesNotMatch(html, /class="nav-link"[^>]*href="#wallet"/);
    assert.match(html, /href="#player" class="nav-link"/);
    assert.doesNotMatch(html, /class="nav-link"[^>]*href="#tienda"/);
    assert.match(html, /id="wallet"[^>]*orb-internal-only/);
    assert.match(html, /id="unifiedNetworkOpsHost" class="orb-internal-only"/);
    assert.match(html, /id="player"[^>]*aria-hidden="false"/);
    assert.match(html, /id="tienda"[^>]*orb-internal-only/);
    assert.match(html, /id="orbTelemetryState"/);
    assert.match(html, /id="orbGiftState"/);
    assert.match(html, /id="clock"/);
  }
});

test('arcade demo credits recover to 100 if stored balance is invalid or depleted', () => {
  const source = fs.readFileSync('public/UI/arcade-slot-machine.js', 'utf8');
  assert.match(source, /n<=0/);
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY,'100'\)/);
  assert.match(source, /creditsRestored\?'CRÉDITOS DEMO REPUESTOS AUTOMÁTICAMENTE: 100,00'/);
  assert.equal(fs.readFileSync('UI/arcade-slot-machine.js', 'utf8'), source);
});
