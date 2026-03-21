import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

const PLACES = [
  { key: 'all', name: '全部', icon: '📦' },
  { key: 'tech', name: '技术中心', icon: '🔧' },
  { key: 'workbench', name: '工作台', icon: '⚙️' },
  { key: 'pharmacy', name: '制药台', icon: '💊' },
  { key: 'armory', name: '防具台', icon: '🛡️' },
];

const PLACE_COLORS = {
  tech: '#20e870',
  workbench: '#18a0d0',
  pharmacy: '#e0a030',
  armory: '#d050d0',
};

const PLACE_ICONS = {
  tech: '🔧', workbench: '⚙️', pharmacy: '💊', armory: '🛡️',
};

// 游戏品级颜色
const GRADE_COLORS = {
  7: '#e04848',  // 红
  6: '#e04848',  // 红
  5: '#ffc040',  // 金
  4: '#c060e0',  // 紫
  3: '#40a0e0',  // 蓝
  2: '#40d070',  // 绿
  1: '#c0c8d0',  // 白
  0: '#6898b0',  // 未知
};

const GRADE_BG = {
  7: 'rgba(224,72,72,0.12)',
  6: 'rgba(224,72,72,0.12)',
  5: 'rgba(255,192,64,0.12)',
  4: 'rgba(192,96,224,0.12)',
  3: 'rgba(64,160,224,0.12)',
  2: 'rgba(64,208,112,0.12)',
  1: 'rgba(192,200,208,0.08)',
  0: 'rgba(104,152,176,0.08)',
};

const GRADE_BORDER = {
  7: 'rgba(224,72,72,0.3)',
  6: 'rgba(224,72,72,0.3)',
  5: 'rgba(255,192,64,0.3)',
  4: 'rgba(192,96,224,0.3)',
  3: 'rgba(64,160,224,0.3)',
  2: 'rgba(64,208,112,0.3)',
  1: 'rgba(192,200,208,0.15)',
  0: 'rgba(104,152,176,0.15)',
};

function GradeBadge({ grade }) {
  const g = grade || 0;
  const color = GRADE_COLORS[g] || GRADE_COLORS[0];
  const bg = GRADE_BG[g] || GRADE_BG[0];
  const border = GRADE_BORDER[g] || GRADE_BORDER[0];
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, background: bg, color, border: `1px solid ${border}`,
    }}>
      {g}级
    </span>
  );
}

function Manufacturing() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState('all');
  const [sortBy, setSortBy] = useState('profit');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from('manufacturing_items')
      .select('*')
      .order('profit', { ascending: false });
    if (data && data.length > 0) {
      setItems(data);
      setLastUpdate(data[0].updated_at);
    }
    setLoading(false);
  }

  const topByPlace = useMemo(() => {
    const result = {};
    for (const p of ['tech', 'workbench', 'pharmacy', 'armory']) {
      const sorted = items.filter(i => i.place === p && i.profit > 0).sort((a, b) => b.profit - a.profit);
      if (sorted.length > 0) result[p] = sorted[0];
    }
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (selectedPlace !== 'all') list = list.filter(i => i.place === selectedPlace);
    list.sort((a, b) => {
      if (sortBy === 'profit') return (b.profit || 0) - (a.profit || 0);
      if (sortBy === 'profit_per_hour') return (b.profit_per_hour || 0) - (a.profit_per_hour || 0);
      if (sortBy === 'sale_price') return (b.sale_price || 0) - (a.sale_price || 0);
      if (sortBy === 'period') return (a.period || 0) - (b.period || 0);
      return 0;
    });
    return list;
  }, [items, selectedPlace, sortBy]);

  function formatPrice(n) {
    if (!n && n !== 0) return '-';
    if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString();
  }

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  if (loading) return <div className="loading"><div className="spinner"></div>加载制造数据中...</div>;

  if (items.length === 0) {
    return (
      <div>
        <h1 className="page-title">特勤处制造利润</h1>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💰</div>
          <p style={{ fontSize: 18, marginBottom: 8 }}>暂无制造数据</p>
          <p style={{ fontSize: 14 }}>请管理员在后台获取数据</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO title="特勤处制造利润" path="/profit" description="三角洲行动特勤处制造利润计算器，实时制造成本与收益分析，找到最赚钱的制造方案。" />
      <h1 className="page-title">特勤处制造利润</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        更新时间：{formatTime(lastUpdate)} · 共 {items.length} 个制造方案
      </p>

      {/* ========== 推荐区 ========== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(32,232,112,0.06), rgba(24,160,208,0.06))',
        border: '1px solid rgba(32,232,112,0.15)',
        borderRadius: 16, padding: '20px 20px 16px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          🏆 各部门最赚推荐
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}>
          {['tech', 'workbench', 'pharmacy', 'armory'].map(place => {
            const item = topByPlace[place];
            if (!item) return null;
            const color = PLACE_COLORS[place];
            const icon = PLACE_ICONS[place];
            const placeName = PLACES.find(p => p.key === place)?.name || place;
            const gradeColor = GRADE_COLORS[item.item_grade] || GRADE_COLORS[0];
            return (
              <div key={place} style={{
                background: 'var(--bg-card)', border: `1px solid ${color}30`,
                borderRadius: 14, padding: '18px 16px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                    background: `${color}15`, color, border: `1px solid ${color}30`,
                  }}>
                    {icon} {placeName}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lv.{item.level} · {item.period}h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  {item.item_image && (
                    <img src={item.item_image} alt="" style={{
                      width: 44, height: 44, objectFit: 'contain', borderRadius: 8,
                      background: 'linear-gradient(135deg, #1a2a3a, #1e3040)',
                      border: `1px solid ${gradeColor}40`, padding: 3, flexShrink: 0,
                    }} onError={e => e.target.style.display = 'none'} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.item_name}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                      <GradeBadge grade={item.item_grade} />
                      {item.per_count > 1 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>×{item.per_count}</span>}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(32,232,112,0.06)', border: '1px solid rgba(32,232,112,0.15)',
                  borderRadius: 10, padding: '10px 12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>净利润</div>
                  <div style={{
                    fontFamily: "'Orbitron', monospace", fontSize: 26, fontWeight: 900, color: '#20e870',
                  }}>+{formatPrice(item.profit)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    每小时 {formatPrice(item.profit_per_hour)} · 售价 {formatPrice(item.sale_price)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========== 筛选 ========== */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
        {PLACES.map(p => (
          <button key={p.key}
            className={`filter-chip ${selectedPlace === p.key ? 'active' : ''}`}
            onClick={() => setSelectedPlace(p.key)}>
            {p.icon} {p.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="profit">总利润 高→低</option>
          <option value="profit_per_hour">利润/小时 高→低</option>
          <option value="sale_price">售价 高→低</option>
          <option value="period">耗时 短→长</option>
        </select>
      </div>

      {/* ========== 列表 ========== */}
      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((item, idx) => {
          const color = PLACE_COLORS[item.place] || '#20e870';
          const isProfitable = item.profit > 0;
          const gradeColor = GRADE_COLORS[item.item_grade] || GRADE_COLORS[0];
          return (
            <div key={item.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'border-color 0.2s', flexWrap: 'wrap',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color + '50'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* 排名 */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: idx < 3 ? `${color}20` : 'var(--bg-secondary)',
                border: `1px solid ${idx < 3 ? color + '40' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700,
                color: idx < 3 ? color : 'var(--text-muted)', flexShrink: 0,
              }}>{idx + 1}</div>

              {/* 图片 */}
              {item.item_image && (
                <img src={item.item_image} alt={item.item_name}
                  style={{
                    width: 44, height: 44, objectFit: 'contain', borderRadius: 8,
                    background: 'linear-gradient(135deg, #1a2a3a, #1e3040)',
                    border: `1px solid ${gradeColor}40`, padding: 2, flexShrink: 0,
                  }}
                  onError={e => e.target.style.display = 'none'} />
              )}

              {/* 名称 */}
              <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.item_name}
                  {item.per_count > 1 && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>×{item.per_count}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 8,
                    background: `${color}15`, color, border: `1px solid ${color}30`,
                  }}>{item.place_name}</span>
                  <GradeBadge grade={item.item_grade} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.period}h</span>
                </div>
              </div>

              {/* 价格信息 */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{ textAlign: 'center', minWidth: 55 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>售价</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(item.sale_price)}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 55 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>成本</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatPrice(item.cost_price)}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 55 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>每小时</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isProfitable ? '#20e870' : '#e04848' }}>
                    {formatPrice(item.profit_per_hour)}
                  </div>
                </div>
                <div style={{
                  textAlign: 'center', minWidth: 80,
                  background: isProfitable ? 'rgba(32,232,112,0.06)' : 'rgba(224,72,72,0.06)',
                  border: `1px solid ${isProfitable ? 'rgba(32,232,112,0.2)' : 'rgba(224,72,72,0.2)'}`,
                  borderRadius: 10, padding: '8px 12px',
                }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 1 }}>总利润</div>
                  <div style={{
                    fontSize: 18, fontWeight: 900,
                    fontFamily: "'Orbitron', monospace",
                    color: isProfitable ? '#20e870' : '#e04848',
                  }}>{isProfitable ? '+' : ''}{formatPrice(item.profit)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 28, padding: 16, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 10,
        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8,
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>💡 说明：</strong>
        总利润 = 售价 - 材料成本 - 手续费。品级颜色：
        <span style={{ color: '#e04848' }}> ■6级</span>
        <span style={{ color: '#ffc040' }}> ■5级</span>
        <span style={{ color: '#c060e0' }}> ■4级</span>
        <span style={{ color: '#40a0e0' }}> ■3级</span>
        <span style={{ color: '#40d070' }}> ■2级</span>
        <span style={{ color: '#c0c8d0' }}> ■1级</span>
      </div>
    </div>
  );
}

export default Manufacturing;