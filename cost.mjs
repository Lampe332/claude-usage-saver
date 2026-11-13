// Works out from Claude Code's transcript files what a session cost
// (main chat + all of its subagents), split by model. API prices are the yardstick.
// Usage:  node cost.mjs            → the 5 most recent sessions
//         node cost.mjs 12         → the 12 most recent
//         node cost.mjs <text>     → sessions whose first message contains <text>
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

// Prices per 1M tokens from aa-data.md, table 3: [input, output, cache read, cache write]
const prices = {};
const data = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'aa-data.md'), 'utf8');
for (const line of data.split('## Table 3')[1].split('\n')) {
  const c = line.split('|').map((s) => s.trim());
  if (c.length > 7 && /^\d/.test(c[3])) prices[c[1].split(' ')[0].toLowerCase()] ??= [c[3], c[4], c[5], c[6]].map(Number);
}
const family = (model) => Object.keys(prices).find((f) => (model ?? '').includes(f)) ?? 'unknown';

// Each reply appears several times in a transcript (one entry per content block) – the last state per message.id counts.
function usage(file) {
  const replies = new Map();
  let start = null, end = null, first = '';
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.timestamp) { start ??= e.timestamp; end = e.timestamp; }
    if (!first && e.type === 'user') {
      const c = e.message?.content;
      const text = typeof c === 'string' ? c : c?.find?.((t) => t.type === 'text')?.text ?? '';
      if (text && !text.startsWith('<')) first = text.replace(/\s+/g, ' ').slice(0, 70);
    }
    if (e.type === 'assistant' && e.message?.usage) replies.set(e.message.id ?? e.uuid, [e.message.model, e.message.usage]);
  }
  const perModel = {};
  for (const [model, u] of replies.values()) {
    const m = (perModel[family(model)] ??= { calls: 0, dollars: 0, output: 0, read: 0 });
    const p = prices[family(model)] ?? [0, 0, 0, 0];
    m.calls++;
    m.output += u.output_tokens ?? 0;
    m.read += u.cache_read_input_tokens ?? 0;
    m.dollars += ((u.input_tokens ?? 0) * p[0] + (u.output_tokens ?? 0) * p[1] + (u.cache_read_input_tokens ?? 0) * p[2] + (u.cache_creation_input_tokens ?? 0) * p[3]) / 1e6;
  }
  return { perModel, start, end, first };
}

const root = join(homedir(), '.claude', 'projects');
const sessions = [];
for (const project of readdirSync(root)) {
  const dir = join(root, project);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) if (f.endsWith('.jsonl')) sessions.push({ file: join(dir, f), time: statSync(join(dir, f)).mtimeMs });
}
sessions.sort((a, b) => b.time - a.time);

const arg = process.argv[2];
const count = /^\d+$/.test(arg ?? '') ? Number(arg) : 5;
const search = arg && !/^\d+$/.test(arg) ? arg.toLowerCase() : null;
let shown = 0;
for (const s of sessions) {
  if (shown >= (search ? 20 : count)) break;
  const main = usage(s.file);
  if (search && !main.first.toLowerCase().includes(search)) continue;
  const total = {};
  const add = (v) => { for (const [f, m] of Object.entries(v.perModel)) { const t = (total[f] ??= { calls: 0, dollars: 0, output: 0, read: 0 }); for (const k of Object.keys(t)) t[k] += m[k]; } };
  add(main);
  const sub = s.file.replace(/\.jsonl$/, '') + '/subagents';
  const agents = existsSync(sub) ? readdirSync(sub).filter((f) => f.endsWith('.jsonl')) : [];
  for (const a of agents) add(usage(join(sub, a)));
  const sum = Object.values(total).reduce((x, m) => x + m.dollars, 0);
  const minutes = main.start ? (new Date(main.end) - new Date(main.start)) / 60000 : 0;
  console.log(`\n${new Date(s.time).toISOString().slice(0, 16).replace('T', ' ')}  ·  $${sum.toFixed(2)}  ·  ${agents.length} subagents  ·  ${minutes.toFixed(0)} min  ·  "${main.first}"`);
  for (const [f, m] of Object.entries(total).sort((a, b) => b[1].dollars - a[1].dollars)) {
    console.log(`   ${f.padEnd(8)} $${m.dollars.toFixed(2).padStart(7)}   ${String(m.calls).padStart(4)} calls   ${(m.read / 1e6).toFixed(1).padStart(6)}M read   ${(m.output / 1e3).toFixed(0).padStart(5)}k output`);
  }
  shown++;
}
if (!shown) console.log('No matching session found.');
