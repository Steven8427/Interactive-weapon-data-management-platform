/* eslint-disable */
// CommonJS copy of src/gunSlug.js — keep the two in sync.
const CAT_SUFFIXES = [
  '精确射手步枪', '紧凑突击步枪', '通用机枪', '轻机枪',
  '突击步枪', '战斗步枪', '射手步枪', '狙击步枪', '冲锋枪', '霰弹枪', '手枪', '机枪', '弓弩', '连狙',
];
function weaponModel(armsName) {
  let n = (armsName || '').trim();
  for (const s of CAT_SUFFIXES) { if (n.endsWith(s)) { n = n.slice(0, -s.length); break; } }
  return n.trim();
}
function gunSlug(armsName) {
  const model = weaponModel(armsName);
  return model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
module.exports = { weaponModel, gunSlug };
