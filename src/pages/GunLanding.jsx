import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCachedData } from '../dataCache';
import { fetchAllRows } from '../supabaseFetch';
import SEO from '../components/SEO';
import { useT } from '../i18n';
import { gunSlug, weaponModel, slugKey } from '../gunSlug';

const CAT_COLOR = { '突击步枪': '#30d060', '战斗步枪': '#e0a030', '射手步枪': '#50b0e0', '冲锋枪': '#d050d0', '机枪': '#e06030', '狙击步枪': '#4090f0', '连狙': '#60c0c0', '霰弹枪': '#d04040', '手枪': '#a0a0a0', '弓弩': '#90d040' };
const CAT_ICON = { '突击步枪': '🔫', '战斗步枪': '⚔️', '射手步枪': '🎯', '冲锋枪': '💨', '机枪': '🔥', '狙击步枪': '🔭', '连狙': '🎯', '霰弹枪': '💥', '手枪': '🔫', '弓弩': '🏹' };
const CATS = ['突击步枪', '战斗步枪', '射手步枪', '冲锋枪', '机枪', '狙击步枪', '连狙', '霰弹枪', '手枪', '弓弩'];
const PAGE_SIZE = 30;
// nicknames used in community data -> the official weapon's slug
const SLUG_ALIAS = { '巴雷特': 'm82' };

function GunLanding() {
  const { t } = useT();
  const { slug } = useParams();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('全部');
  const [sortBy, setSortBy] = useState('hot');
  const [page, setPage] = useState(1);

  const fetchAll = useCallback(async () => {
    const [official, guns, variants, playersData] = await Promise.all([
      supabase.from('official_gun_codes').select('id, name, arms_name, arms_category, arms_pic, solution_code, author_nickname, apply_num, price').neq('is_hidden', true).order('apply_num', { ascending: false }),
      fetchAllRows(() => supabase.from('guns').select('id, name, category, image_url, player_id').order('id')),
      fetchAllRows(() => supabase.from('gun_variants').select('id, gun_id, code, version, price, mod_type, status').or('status.is.null,status.eq.approved').order('id')),
      supabase.from('players').select('id, nickname, username'),
    ]);
    return { official: official.data || [], guns, variants, players: playersData.data || [] };
  }, []);
  const [data, loading] = useCachedData('gun_landing_all', fetchAll);

  // Merge official/streamer codes + approved community codes, grouped by weapon.
  const weapons = useMemo(() => {
    const d = data || { official: [], guns: [], variants: [], players: [] };
    // keyed by slugKey so "SCAR-H"/"SCARH" and "SG-552"/"SG552" merge into one
    // weapon; the first slug seen (official codes come first) stays canonical.
    const map = {};
    const ensure = (s, model, category, pic) => {
      const k = slugKey(SLUG_ALIAS[s] || s);
      if (!map[k]) map[k] = { slug: SLUG_ALIAS[s] || s, aliases: [], model, category: '', catVotes: {}, pic, codes: [], apply: 0 };
      const w = map[k];
      if (!w.aliases.includes(s)) w.aliases.push(s);
      if (!w.pic && pic) w.pic = pic;
      if (category) w.catVotes[category] = (w.catVotes[category] || 0) + 1;
      return w;
    };
    for (const c of d.official) {
      const s = gunSlug(c.arms_name); if (!s) continue;
      const w = ensure(s, weaponModel(c.arms_name), c.arms_category, c.arms_pic);
      w.codes.push({ id: 'o' + c.id, source: 'official', name: c.name, code: c.solution_code, author: c.author_nickname, apply: c.apply_num || 0, price: c.price, version: '' });
      w.apply += c.apply_num || 0;
    }
    const pmap = {}; for (const p of d.players) pmap[p.id] = p.nickname || p.username;
    const gById = {}; for (const g of d.guns) gById[g.id] = g;
    for (const v of d.variants) {
      if (v.status && v.status !== 'approved') continue; // only approved / legacy-null
      const g = gById[v.gun_id]; if (!g) continue;
      const s = gunSlug(g.name); if (!s) continue;
      const w = ensure(s, weaponModel(g.name), g.category, g.image_url);
      w.codes.push({ id: 'c' + v.id, source: 'community', name: v.mod_type || v.version || t('玩家分享'), code: v.code, author: pmap[g.player_id] || t('玩家'), apply: 0, price: v.price, version: v.version });
    }
    // category = the one most of the weapon's codes agree on (a few rows carry a wrong default)
    for (const w of Object.values(map)) {
      const votes = Object.entries(w.catVotes).sort((a, b) => b[1] - a[1] || (CATS.includes(b[0]) ? 1 : 0) - (CATS.includes(a[0]) ? 1 : 0));
      w.category = votes.length ? votes[0][0] : '';
    }
    return Object.values(map).filter(w => w.codes.length).sort((a, b) => b.apply - a.apply || b.codes.length - a.codes.length);
  }, [data, t]);

  // category tabs (only categories that have weapons), with counts
  const catCounts = useMemo(() => {
    const m = {};
    weapons.forEach(w => { const c = w.category || '其他'; m[c] = (m[c] || 0) + 1; });
    return m;
  }, [weapons]);
  const catTabs = useMemo(() => ['全部', ...CATS.filter(c => catCounts[c]), ...Object.keys(catCounts).filter(c => !CATS.includes(c))], [catCounts]);

  const filteredWeapons = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = weapons;
    if (filterCat !== '全部') r = r.filter(w => (w.category || '其他') === filterCat);
    if (q) r = r.filter(w =>
      w.model.toLowerCase().includes(q) ||
      (w.category || '').toLowerCase().includes(q) ||
      w.codes.some(c => (c.code || '').toLowerCase().includes(q) || (c.author || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q))
    );
    if (sortBy === 'count') r = [...r].sort((a, b) => b.codes.length - a.codes.length || b.apply - a.apply);
    if (sortBy === 'name') r = [...r].sort((a, b) => a.model.localeCompare(b.model, 'zh-Hans-CN', { numeric: true }));
    return r;
  }, [weapons, search, filterCat, sortBy]);

  // pagination: back to page 1 whenever the filter changes
  const pageCount = Math.max(1, Math.ceil(filteredWeapons.length / PAGE_SIZE));
  useEffect(() => { setPage(1); }, [search, filterCat, sortBy]);
  const curPage = Math.min(page, pageCount);
  const pageWeapons = filteredWeapons.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  function goPage(p) {
    setPage(p);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => toast.success(t('改枪码已复制！'))).catch(() => {
      const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success(t('改枪码已复制！'));
    });
  }
  function fmtNum(n) { if (!n) return '0'; if (n >= 10000) return (n / 10000).toFixed(1) + 'w'; if (n >= 1000) return (n / 1000).toFixed(1) + 'k'; return String(n); }

  function SourceTag({ code }) {
    const isCommunity = code.source === 'community';
    const bg = isCommunity ? 'rgba(24,160,208,0.15)' : 'rgba(32,232,112,0.12)';
    const col = isCommunity ? '#18a0d0' : '#20e870';
    return <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: bg, color: col, flexShrink: 0 }}>{isCommunity ? t('社区') : t('官方/主播')}</span>;
  }

  if (loading) return <div className="loading"><div className="spinner"></div>{t('加载中...')}</div>;

  // ---- index: /gun ----
  if (!slug) {
    return (
      // full-height column so the pager sits at the bottom of the page no matter
      // how many weapons the current page/category shows
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 130px)' }}>
        <SEO title={t('武器改枪码大全')} path="/gun" description={t('三角洲行动各热门武器的改枪码大全，按武器查询官方与主播同款改枪码，一键复制。')} />
        <h1 className="page-title">🔫 {t('武器改枪码大全')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>{t('按武器查询三角洲行动改枪码 · 共 {n} 把武器', { n: weapons.length })}</p>
        {/* 分类 */}
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          {catTabs.map(cat => (
            <button key={cat} className={`filter-chip ${filterCat === cat ? 'active' : ''}`} onClick={() => setFilterCat(cat)}>
              {cat !== '全部' && CAT_ICON[cat] ? CAT_ICON[cat] + ' ' : ''}{t(cat)}
              <span style={{ opacity: 0.6, marginLeft: 4, fontSize: '0.85em' }}>{cat === '全部' ? weapons.length : catCounts[cat]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <span className="search-icon">🔍</span>
            <input placeholder={t('搜索枪名、改枪码、作者...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="hot">{t('热度排序')}</option>
            <option value="count">{t('方案最多')}</option>
            <option value="name">{t('名称排序')}</option>
          </select>
        </div>
        {filteredWeapons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>{t('没有找到匹配的武器')}</div>
        ) : (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {pageWeapons.map(w => {
              const c = CAT_COLOR[w.category] || '#20e870';
              return (
                <Link key={w.slug} to={`/gun/${w.slug}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${c}50`} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ width: 52, height: 38, flexShrink: 0, background: 'linear-gradient(135deg,#1a2a3a,#1e3040)', borderRadius: 6, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {w.pic
                      ? <img src={w.pic} alt={w.model} loading="lazy" style={{ width: 48, height: 34, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                      : (CAT_ICON[w.category] || '🔫')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.model}</div>
                    <div style={{ fontSize: 12, color: c }}>{t(w.category)} · {t('{n} 个方案', { n: w.codes.length })}</div>
                  </div>
                </Link>
              );
            })}
          </div>
          {pageCount > 1 && (
            // pinned: pushed to the bottom of the column (marginTop auto) and sticky
            // to the bottom of the screen while scrolling a long page
            <div style={{ position: 'sticky', bottom: 0, zIndex: 5, marginTop: 'auto', paddingTop: 20, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, flexWrap: 'wrap', width: '100%', padding: '10px 0 12px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
              <button className="filter-chip" disabled={curPage <= 1} onClick={() => goPage(curPage - 1)} style={{ opacity: curPage <= 1 ? 0.4 : 1 }}>‹ {t('上一页')}</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                <button key={p} className={`filter-chip ${p === curPage ? 'active' : ''}`} onClick={() => goPage(p)} style={{ minWidth: 36, justifyContent: 'center' }}>{p}</button>
              ))}
              <button className="filter-chip" disabled={curPage >= pageCount} onClick={() => goPage(curPage + 1)} style={{ opacity: curPage >= pageCount ? 0.4 : 1 }}>{t('下一页')} ›</button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{t('第 {p} / {n} 页', { p: curPage, n: pageCount })}</span>
            </div>
            </div>
          )}
        </>)}
      </div>
    );
  }

  // ---- single weapon: /gun/:slug (also reachable via merged aliases like /gun/scarh) ----
  const want = (slug || '').toLowerCase();
  const w = weapons.find(x => x.slug === want || x.aliases.includes(want)) || weapons.find(x => slugKey(x.slug) === slugKey(want));
  if (!w) {
    return (
      <div>
        <SEO title={t('武器改枪码')} path={`/gun/${slug}`} description={t('三角洲行动武器改枪码')} />
        <Link to="/gun" style={{ color: 'var(--text-muted)', fontSize: 14 }}>← {t('武器改枪码大全')}</Link>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>{t('没有找到匹配的枪械')}</div>
      </div>
    );
  }
  const c = CAT_COLOR[w.category] || '#20e870';
  const codeList = [...w.codes].sort((a, b) => (a.source === b.source ? (b.apply || 0) - (a.apply || 0) : a.source === 'official' ? -1 : 1));
  const communityCount = w.codes.filter(x => x.source === 'community').length;

  return (
    <div>
      <SEO title={t('「{model}」改枪码大全', { model: w.model })} path={`/gun/${w.slug}`}
        description={t('「{model}」三角洲改枪码大全，收录该武器的官方与主播同款改枪码，一键复制导入游戏。', { model: w.model })} />
      <Link to="/gun" style={{ color: 'var(--text-muted)', fontSize: 14, display: 'inline-block', marginBottom: 12 }}>← {t('武器改枪码大全')}</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        {w.pic && <img src={w.pic} alt={w.model} style={{ width: 72, height: 50, objectFit: 'contain', background: 'linear-gradient(135deg,#1a2a3a,#1e3040)', borderRadius: 8, border: '1px solid var(--border)', padding: 4, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
        <div>
          <h1 className="page-title" style={{ fontSize: 24, marginBottom: 2 }}>{t('「{model}」改枪码', { model: w.model })}</h1>
          <div style={{ fontSize: 13, color: c }}>{t(w.category)} · {t('{n} 个方案', { n: codeList.length })}{communityCount > 0 ? ` · ${t('含社区 {n} 个', { n: communityCount })}` : ''}</div>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{t('「{model}」三角洲改枪码大全，收录该武器的官方、主播与玩家社区改枪码，一键复制导入游戏。', { model: w.model })}</p>

      <div style={{ display: 'grid', gap: 10 }}>
        {codeList.map((code, idx) => (
          <div key={code.id} onClick={() => copyCode(code.code)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${c}50`} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: idx < 3 ? `${c}20` : 'var(--bg-secondary)', border: `1px solid ${idx < 3 ? c + '40' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: idx < 3 ? c : 'var(--text-muted)' }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.name}</span>
                  <SourceTag code={code} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{code.author}{code.apply ? ` · ${t('{n} 使用', { n: fmtNum(code.apply) })}` : ''}</div>
              </div>
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: 'var(--accent)', background: 'rgba(32,232,112,0.04)', border: '1px solid rgba(32,232,112,0.1)', borderRadius: 6, padding: '6px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GunLanding;
