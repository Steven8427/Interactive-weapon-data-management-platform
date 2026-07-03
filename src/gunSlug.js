// Shared weapon-name -> slug logic (kept identical in scripts/gun-slug.js
// for the build-time SEO generator). arms_name looks like "RM277突击步枪":
// an ASCII model + a Chinese category suffix. We slug the ASCII model.
const CAT_SUFFIXES = [
  '精确射手步枪', '紧凑突击步枪', '通用机枪', '轻机枪',
  '突击步枪', '战斗步枪', '射手步枪', '狙击步枪', '冲锋枪', '霰弹枪', '手枪', '机枪', '弓弩', '连狙',
];

export function weaponModel(armsName) {
  let n = (armsName || '').trim();
  for (const s of CAT_SUFFIXES) { if (n.endsWith(s)) { n = n.slice(0, -s.length); break; } }
  return n.trim();
}

export function gunSlug(armsName) {
  const model = weaponModel(armsName);
  return model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
