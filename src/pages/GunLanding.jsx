import React, { useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import { useCachedData } from '../dataCache';
import SEO from '../components/SEO';
import { useT } from '../i18n';
import { gunSlug, weaponModel } from '../gunSlug';

const CAT_COLOR = { '突击步枪': '#30d060', '战斗步枪': '#e0a030', '射手步枪': '#50b0e0', '冲锋枪': '#d050d0', '机枪': '#e06030', '狙击步枪': '#4090f0', '连狙': '#60c0c0', '霰弹枪': '#d04040', '手枪': '#a0a0a0', '弓弩': '#90d040' };

function GunLanding() {
  const { t } = useT();
  const { slug } = useParams();

  const fetchCodes = useCallback(async () => {
    const { data } = await supabase.from('official_gun_codes').select('id, name, arms_name, arms_category, arms_pic, solution_code, author_nickname, apply_num, price').neq('is_hidden', true).order('apply_num', { ascending: false });
    return data || [];
  }, []);
  const [rawCodes, loading] = useCachedData('gun_landing_codes', fetchCodes);
  const codes = rawCodes || [];

  // group by weapon slug
  const weapons = useMemo(() => {
    const map = {};
    for (const c of codes) {
      const s = gunSlug(c.arms_name);
      if (!s) continue;
      if (!map[s]) map[s] = { slug: s, model: weaponModel(c.arms_name), category: c.arms_category, pic: c.arms_pic, codes: [], apply: 0 };
      map[s].codes.push(c);
      map[s].apply += (c.apply_num || 0);
      if (!map[s].pic && c.arms_pic) map[s].pic = c.arms_pic;
    }
    return Object.values(map).sort((a, b) => b.apply - a.apply);
  }, [codes]);

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => toast.success(t('改枪码已复制！'))).catch(() => {
      const ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); toast.success(t('改枪码已复制！'));
    });
  }
  function fmtNum(n) { if (!n) return '0'; if (n >= 10000) return (n / 10000).toFixed(1) + 'w'; if (n >= 1000) return (n / 1000).toFixed(1) + 'k'; return String(n); }

  if (loading) return <div className="loading"><div className="spinner"></div>{t('加载中...')}</div>;

  // ---- index: /gun ----
  if (!slug) {
    return (
      <div>
        <SEO title={t('武器改枪码大全')} path="/gun" description={t('三角洲行动各热门武器的改枪码大全，按武器查询官方与主播同款改枪码，一键复制。')} />
        <h1 className="page-title">🔫 {t('武器改枪码大全')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{t('按武器查询三角洲行动改枪码 · 共 {n} 把武器', { n: weapons.length })}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {weapons.map(w => {
            const c = CAT_COLOR[w.category] || '#20e870';
            return (
              <Link key={w.slug} to={`/gun/${w.slug}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${c}50`} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                {w.pic && <img src={w.pic} alt={w.model} style={{ width: 48, height: 34, objectFit: 'contain', flexShrink: 0, background: 'linear-gradient(135deg,#1a2a3a,#1e3040)', borderRadius: 6, border: '1px solid var(--border)', padding: 2 }} onError={e => e.target.style.display = 'none'} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.model}</div>
                  <div style={{ fontSize: 12, color: c }}>{t(w.category)} · {t('{n} 个方案', { n: w.codes.length })}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- single weapon: /gun/:slug ----
  const w = weapons.find(x => x.slug === slug);
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
  const codeList = [...w.codes].sort((a, b) => (b.apply_num || 0) - (a.apply_num || 0));

  return (
    <div>
      <SEO title={t('「{model}」改枪码大全', { model: w.model })} path={`/gun/${w.slug}`}
        description={t('「{model}」三角洲改枪码大全，收录该武器的官方与主播同款改枪码，一键复制导入游戏。', { model: w.model })} />
      <Link to="/gun" style={{ color: 'var(--text-muted)', fontSize: 14, display: 'inline-block', marginBottom: 12 }}>← {t('武器改枪码大全')}</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        {w.pic && <img src={w.pic} alt={w.model} style={{ width: 72, height: 50, objectFit: 'contain', background: 'linear-gradient(135deg,#1a2a3a,#1e3040)', borderRadius: 8, border: '1px solid var(--border)', padding: 4, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
        <div>
          <h1 className="page-title" style={{ fontSize: 24, marginBottom: 2 }}>{t('「{model}」改枪码', { model: w.model })}</h1>
          <div style={{ fontSize: 13, color: c }}>{t(w.category)} · {t('{n} 个方案', { n: codeList.length })}</div>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{t('「{model}」三角洲改枪码大全，收录该武器的官方与主播同款改枪码，一键复制导入游戏。', { model: w.model })}</p>

      <div style={{ display: 'grid', gap: 10 }}>
        {codeList.map((code, idx) => (
          <div key={code.id} onClick={() => copyCode(code.solution_code)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${c}50`} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: idx < 3 ? `${c}20` : 'var(--bg-secondary)', border: `1px solid ${idx < 3 ? c + '40' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: idx < 3 ? c : 'var(--text-muted)' }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{code.author_nickname} · {t('{n} 使用', { n: fmtNum(code.apply_num) })}</div>
              </div>
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: 'var(--accent)', background: 'rgba(32,232,112,0.04)', border: '1px solid rgba(32,232,112,0.1)', borderRadius: 6, padding: '6px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{code.solution_code}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GunLanding;
