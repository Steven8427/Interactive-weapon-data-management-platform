// Single source of truth for weapon categories (order, colors). Icons live in
// components/WeaponIcon.jsx. Used by the community, weapon, official and
// streamer pages.
export const CATS = ['突击步枪', '战斗步枪', '射手步枪', '冲锋枪', '机枪', '狙击步枪', '连狙', '霰弹枪', '手枪', '弓弩'];

export const CAT_COLOR = {
  '突击步枪': '#30d060', '战斗步枪': '#e0a030', '射手步枪': '#50b0e0', '冲锋枪': '#d050d0', '机枪': '#e06030',
  '狙击步枪': '#4090f0', '连狙': '#60c0c0', '霰弹枪': '#d04040', '手枪': '#a0a0a0', '弓弩': '#90d040',
};

export const catColor = cat => CAT_COLOR[cat] || '#20e870';
