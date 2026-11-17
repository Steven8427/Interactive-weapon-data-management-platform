// Bulk build-code import: turn pasted text (one code per line, any notes
// around it) into rows for official_gun_codes. Pure functions, no imports.
//
// Handles lines like:
//   M7战斗步枪-烽火地带-6J175A40A5Q0H281F3DG6(满改)
//   K437突击步枪-烽火地带-6LDAACO09NQFMIL0O8SAF（37）
//   M700狙击步枪-烽火地带-6L4DUNO09QFSF9NRU9BEI  DQL9853
//   MK4腰射双修版-6L9UC9S07FI7MVPVB9B3H          (weapon + note, no mode)
//   6L9UC9S07FI7MVPVB9B3H                          (bare token: weapon unknown)

const MODES = ['烽火地带', '全面战场', '大战场', '烽火'];
const TOKEN_RE = /^(.*?)([0-9][0-9A-Z]{20})(?![0-9A-Z])(.*)$/;

// object_name suffix -> site category (longest suffixes first)
const SUFFIX_CAT = [
  ['精确射手步枪', '射手步枪'], ['紧凑突击步枪', '突击步枪'], ['通用机枪', '机枪'], ['轻机枪', '机枪'],
  ['突击步枪', '突击步枪'], ['战斗步枪', '战斗步枪'], ['射手步枪', '射手步枪'], ['狙击步枪', '狙击步枪'],
  ['冲锋枪', '冲锋枪'], ['霰弹枪', '霰弹枪'], ['杠杆步枪', '射手步枪'], ['手枪', '手枪'], ['弓', '弓弩'],
];

export function categoryOf(objectName) {
  const n = objectName || '';
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

const norm = s => (s || '').toLowerCase().replace(/[\s\-_.·]/g, '');

// "65w" / "65万" / "9.5W" in a note -> price in coins (650000); returns [price, noteWithoutPrice]
function extractPrice(note) {
  const m = note.match(/(\d+(?:\.\d+)?)\s*[wW万]/);
  if (!m) return [0, note];
  return [Math.round(parseFloat(m[1]) * 10000), note.replace(m[0], '').trim()];
}

function cleanNote(s) {
  return (s || '')
    .replace(/[()（）[\]【】]/g, ' ')
    .replace(/^[\s\-—:：,，|]+|[\s\-—:：,，|]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find the catalog weapon a free-text prefix refers to. Exact object_name
// first, then the longest catalog model that the text starts with
// ("MK4腰射双修版" -> MK4冲锋枪, leftover "腰射双修版").
function matchWeapon(text, catalog) {
  const t = norm(text);
  if (!t) return null;
  let best = null;
  for (const item of catalog) {
    const full = norm(item.object_name);
    if (full && t === full) return { item, rest: '' };
    const model = norm(modelOf(item.object_name));
    for (const key of [full, model]) {
      if (key && t.startsWith(key) && (!best || key.length > best.len)) best = { item, len: key.length, key };
    }
  }
  if (!best) return null;
  // map the matched length back onto the original (un-normalized) text
  let consumed = 0, i = 0;
  while (i < text.length && consumed < best.len) { if (norm(text[i])) consumed++; i++; }
  return { item: best.item, rest: text.slice(i) };
}

// catalog: [{ object_name, pic }] (gun_catalog rows, primary_class = 'gun')
// existingTokens: Set of tokens already stored (any author)
export function parseCodeLines(text, catalog = [], existingTokens = new Set()) {
  const seen = new Set();
  const rows = [];
  for (const raw of (text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(TOKEN_RE);
    if (!m) { rows.push({ raw: line, status: 'invalid', reason: '未识别到改枪码' }); continue; }
    const [, before, token, after] = m;

    let prefix = before.replace(/[-\s]+$/, '').trim();
    let mode = '';
    for (const md of MODES) {
      const suffix = '-' + md;
      if (prefix.endsWith(suffix)) { mode = md; prefix = prefix.slice(0, -suffix.length).trim(); break; }
      if (prefix === md) { mode = md; prefix = ''; break; }
    }
    const hit = matchWeapon(prefix, catalog);
    let row;

    if (mode && prefix) {
      // A complete game code ("<枪名>-<模式>-<token>"): keep it exactly as the
      // game wrote it; the catalog only supplies the picture.
      const [price, rest] = extractPrice(cleanNote(after));
      const note = cleanNote(rest);
      row = {
        raw: line, token, mode, note, price,
        arms_name: prefix,
        arms_pic: hit ? (hit.item.pic || null) : null,
        arms_category: categoryOf(prefix) || (hit ? categoryOf(hit.item.object_name) : ''),
        model: modelOf(prefix),
        solution_code: `${prefix}-${mode}-${token}`,
        status: 'ok',
      };
    } else if (hit) {
      // Non-standard prefix ("MK4腰射双修版-<token>"): weapon from the catalog,
      // the leftover text becomes the note, code rebuilt in the standard form.
      const [price, rest] = extractPrice(cleanNote([hit.rest, after].join(' ')));
      const note = cleanNote(rest);
      const md = mode || '烽火地带';
      row = {
        raw: line, token, mode: md, note, price,
        arms_name: hit.item.object_name,
        arms_pic: hit.item.pic || null,
        arms_category: categoryOf(hit.item.object_name),
        model: modelOf(hit.item.object_name),
        solution_code: `${hit.item.object_name}-${md}-${token}`,
        status: 'ok',
      };
    } else {
      row = {
        raw: line, token, mode: mode || '烽火地带', note: cleanNote(after), price: 0,
        arms_name: prefix, arms_pic: null, arms_category: categoryOf(prefix), model: modelOf(prefix),
        solution_code: prefix ? `${prefix}-${mode || '烽火地带'}-${token}` : token,
        status: 'unknown_weapon', reason: prefix ? `未匹配枪械「${prefix}」` : '没有枪名',
      };
    }
    row.name = [row.model, row.note].filter(Boolean).join(' ') || token;

    if (existingTokens.has(token)) { row.status = 'duplicate'; row.reason = '已存在'; }
    else if (seen.has(token)) { row.status = 'duplicate'; row.reason = '本次重复'; }
    seen.add(token);
    rows.push(row);
  }
  return rows;
}

// Pull the 21-char token out of any stored solution_code (full or bare).
export function tokenOf(code) {
  const m = (code || '').match(/([0-9][0-9A-Z]{20})(?![0-9A-Z])/);
  return m ? m[1] : '';
}
