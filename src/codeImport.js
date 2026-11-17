// Bulk build-code import helpers. Pure functions, no imports.
//
// RULE: the build code is stored EXACTLY as pasted (everything up to and
// including the 21-char token). The game only recognises the original text,
// so we never rewrite it — the weapon catalog is only used to pick a gun
// name, category and picture.
//
// Accepts both:
//  * plain lines, one code per line, with optional notes around it
//      M7战斗步枪-烽火地带-6J175A40A5Q0H281F3DG6(满改)
//      MK4腰射双修版-6L9UC9S07FI7MVPVB9B3H
//      K416突击步枪-烽火地带-6JNVN3S03EINQ63AGU05N T0 40w 半改
//  * spreadsheet pastes (tab-separated), e.g. 枪械名称|版本排行|改装价格|类型|代码,
//    including several such blocks side by side and names written only on
//    the first row of each weapon.

const TOKEN_FIND = /[0-9][0-9A-Z]{20}(?![0-9A-Z])/;
const MODES = ['烽火地带', '全面战场', '大战场', '烽火'];
const VERSION_WORDS = ['狙击', '连狙', '手枪', '弓弩', '霰弹', '机枪'];

// object_name suffix -> site category (longest suffixes first)
const SUFFIX_CAT = [
  ['精确射手步枪', '射手步枪'], ['紧凑突击步枪', '突击步枪'], ['通用机枪', '机枪'], ['轻机枪', '机枪'],
  ['突击步枪', '突击步枪'], ['战斗步枪', '战斗步枪'], ['射手步枪', '射手步枪'], ['狙击步枪', '狙击步枪'],
  ['冲锋枪', '冲锋枪'], ['霰弹枪', '霰弹枪'], ['杠杆步枪', '射手步枪'], ['手枪', '手枪'], ['弓', '弓弩'],
];

export function categoryOf(objectName) {
  const n = (objectName || '').trim();
  for (const [suf, cat] of SUFFIX_CAT) if (n.endsWith(suf)) return cat;
  return '';
}

// "M7战斗步枪" -> "M7"
export function modelOf(objectName) {
  let n = (objectName || '').trim();
  for (const [suf] of SUFFIX_CAT) {
    if (n.endsWith(suf) && n.length > suf.length) { n = n.slice(0, -suf.length); break; }
  }
  return n.trim();
}

// loose key for comparing weapon names: "SMG45" == "SMG-45", "MCXLT" == "MCX LT"
export const nameKey = s => (s || '').toLowerCase().replace(/[\s\-_.·]/g, '');

export function tokenOf(code) {
  const m = (code || '').match(TOKEN_FIND);
  return m ? m[0] : '';
}

// Split a chunk of text around its token: code (verbatim), token, the weapon
// part of the code (mode removed) and whatever follows the token.
function splitCode(text) {
  const m = (text || '').match(TOKEN_FIND);
  if (!m) return null;
  const end = m.index + m[0].length;
  const code = text.slice(0, end).trim();
  let prefix = text.slice(0, m.index).replace(/[-\s]+$/, '').trim();
  for (const md of MODES) {
    if (prefix.endsWith('-' + md)) { prefix = prefix.slice(0, -(md.length + 1)).trim(); break; }
    if (prefix === md) { prefix = ''; break; }
  }
  return { code, token: m[0], prefix, after: text.slice(end) };
}

function cleanNote(s) {
  return (s || '')
    .replace(/[()（）[\]【】]/g, ' ')
    .replace(/^[\s\-—:：,，|]+|[\s\-—:：,，|]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// pull "65w"/"9.5W"/"5k"/"65万" out of free text -> [priceText, rest]
function takePrice(note) {
  const m = note.match(/(\d+(?:\.\d+)?)\s*([wW万kK])(?![a-zA-Z])/);
  if (!m) return ['', note];
  return [m[1] + m[2], cleanNote(note.replace(m[0], ' '))];
}
// pull "T0".."T5" (or 狙击/连狙/...) out of free text -> [version, rest]
function takeVersion(note) {
  const m = note.match(/(?:^|[^A-Za-z0-9])(T[0-5])(?![0-9])/i);
  if (m) return [m[1].toUpperCase(), cleanNote(note.replace(m[1], ' '))];
  return ['', note];
}

// Find the catalog weapon a free-text name refers to: exact object_name, else
// the longest catalog name/model the text starts with ("MK4腰射双修版" -> MK4).
function matchWeapon(text, catalog) {
  const t = nameKey(text);
  if (!t) return null;
  let best = null;
  for (const item of catalog || []) {
    const full = nameKey(item.object_name);
    if (full && t === full) return { item, rest: '' };
    const model = nameKey(modelOf(item.object_name));
    for (const key of [full, model]) {
      if (key && t.startsWith(key) && (!best || key.length > best.len)) best = { item, len: key.length };
    }
  }
  if (!best) return null;
  let consumed = 0, i = 0;
  while (i < text.length && consumed < best.len) { if (nameKey(text[i])) consumed++; i++; }
  return { item: best.item, rest: text.slice(i) };
}

function weaponInfo(prefix, tableName, catalog) {
  const hitCode = matchWeapon(prefix, catalog);
  const hit = hitCode || matchWeapon(tableName, catalog);
  const model = hit ? modelOf(hit.item.object_name) : modelOf(prefix);
  return {
    hit,
    leftover: hitCode ? hitCode.rest : '',
    object_name: hit ? hit.item.object_name : prefix,
    pic: hit ? (hit.item.pic || null) : null,
    category: categoryOf(prefix) || (hit ? categoryOf(hit.item.object_name) : ''),
    model,
  };
}

// ---------------------------------------------------------------------------
// Streamer codes (official_gun_codes): plain lines -> rows
// ---------------------------------------------------------------------------
export function parseCodeLines(text, catalog = [], existingTokens = new Set()) {
  const seen = new Set();
  const rows = [];
  for (const raw of (text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const s = splitCode(line);
    if (!s) { rows.push({ raw: line, status: 'invalid', reason: '未识别到改枪码' }); continue; }
    const w = weaponInfo(s.prefix, '', catalog);
    const [priceText, rest] = takePrice(cleanNote([w.leftover, s.after].join(' ')));
    const note = cleanNote(rest);
    const pm = priceText.match(/^(\d+(?:\.\d+)?)([wW万kK])$/);
    const price = pm ? Math.round(parseFloat(pm[1]) * (/[kK]/.test(pm[2]) ? 1000 : 10000)) : 0;
    const row = {
      raw: line, token: s.token, solution_code: s.code, note, price,
      arms_name: w.object_name, arms_pic: w.pic, arms_category: w.category, model: w.model,
    };
    row.name = [row.model, note].filter(Boolean).join(' ') || s.token;
    if (existingTokens.has(s.token)) { row.status = 'duplicate'; row.reason = '已存在'; }
    else if (seen.has(s.token)) { row.status = 'duplicate'; row.reason = '本次重复'; }
    else if (!w.object_name) { row.status = 'unknown_weapon'; row.reason = '没有枪名'; }
    else row.status = 'ok';
    seen.add(s.token);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Player codes (guns + gun_variants): plain lines OR spreadsheet pastes
// Returns rows: { code, token, gunName, object_name, pic, category,
//                 version, price, mod_type, status, reason }
// ---------------------------------------------------------------------------
function classifyCells(cells) {
  // fewer than 4 cells before the code: guess each cell's role by its content
  const out = { name: '', version: '', price: '', mod: '' };
  for (const c of cells.map(x => x.trim()).filter(Boolean)) {
    if (!out.version && (/^T[0-5]$/i.test(c) || VERSION_WORDS.includes(c))) out.version = c;
    else if (!out.price && /^\d+(?:\.\d+)?\s*[wW万kK]?$/.test(c)) out.price = c;
    else if (!out.name) out.name = c;
    else out.mod = out.mod ? out.mod + ' ' + c : c;
  }
  return out;
}

export function parseBuildTable(text, catalog = [], existingTokens = new Set()) {
  const seen = new Set();
  const rows = [];
  const carry = {}; // code-column index -> weapon name carried down that block

  for (const raw of (text || '').split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const cells = raw.split('\t');
    const codeCols = cells.map((c, i) => (TOKEN_FIND.test(c) ? i : -1)).filter(i => i >= 0);

    if (!codeCols.length) {
      // header / section title rows: a title starts a new weapon section
      cells.forEach((c, j) => { if (c.trim()) delete carry[j + 4]; });
      continue;
    }

    for (const ci of codeCols) {
      const s = splitCode(cells[ci]);
      let f;
      if (cells.length === 1) {
        // plain line: notes after the code carry version / price / type
        let note = cleanNote(s.after);
        let version, price;
        [version, note] = takeVersion(note);
        [price, note] = takePrice(note);
        f = { name: '', version, price, mod: cleanNote(note) };
      } else if (ci >= 4) {
        f = { name: cells[ci - 4].trim(), version: cells[ci - 3].trim(), price: cells[ci - 2].trim(), mod: cells[ci - 1].trim() };
        if (s.after.trim() && !f.mod) f.mod = cleanNote(s.after);
      } else {
        f = classifyCells(cells.slice(0, ci));
      }
      if (/抖音搜|^枪械名称$/.test(f.name)) f.name = '';
      if (f.name) carry[ci] = f.name; else f.name = carry[ci] || '';

      const w = weaponInfo(s.prefix, f.name, catalog);
      // gun name: the pasted weapon name, written the catalog way when it is the same gun
      let gunName = f.name || w.model;
      if (w.hit && f.name && nameKey(f.name) === nameKey(w.model)) gunName = w.model;
      const mod = f.mod || (!f.name ? cleanNote(w.leftover) : '');

      const row = {
        raw: raw.trim(), code: s.code, token: s.token, gunName,
        object_name: w.object_name, pic: w.pic, category: w.category,
        version: f.version, price: f.price, mod_type: mod,
      };
      if (existingTokens.has(s.token)) { row.status = 'duplicate'; row.reason = '已存在'; }
      else if (seen.has(s.token)) { row.status = 'duplicate'; row.reason = '本次重复'; }
      else if (!gunName) { row.status = 'unknown_weapon'; row.reason = '没有枪名，请填写'; }
      else row.status = 'ok';
      seen.add(s.token);
      rows.push(row);
    }
  }
  return rows;
}
