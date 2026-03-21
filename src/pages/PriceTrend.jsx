import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

const CATEGORIES = [
  { key: 'all', name: '全部', icon: '📦' },
  { key: '突击步枪', name: '突击步枪', icon: '🔫' },
  { key: '冲锋枪', name: '冲锋枪', icon: '💨' },
  { key: '射手步枪', name: '射手步枪', icon: '🎯' },
  { key: '狙击步枪', name: '狙击步枪', icon: '🔭' },
  { key: '机枪', name: '机枪', icon: '⚡' },
  { key: '霰弹枪', name: '霰弹枪', icon: '💥' },
  { key: '手枪', name: '手枪', icon: '🔫' },
  { key: '护甲', name: '护甲', icon: '🛡️' },
  { key: '头盔', name: '头盔', icon: '⛑️' },
  { key: '背包', name: '背包', icon: '🎒' },
  { key: '胸挂', name: '胸挂', icon: '🦺' },
  { key: '子弹', name: '子弹', icon: '🔹' },
  { key: '医疗', name: '医疗', icon: '💊' },
];

const CAT_COLORS = {
  '突击步枪': '#20e870', '冲锋枪': '#18a0d0', '射手步枪': '#e0a030',
  '狙击步枪': '#e06040', '机枪': '#d050d0', '霰弹枪': '#f0c040',
  '手枪': '#90a0b0', '护甲': '#4090e0', '头盔': '#60c0a0',
  '背包': '#c08040', '胸挂': '#a070d0', '子弹': '#e08060', '医疗': '#40d090',
};

function PriceTrend() {
  const [todayPrices, setTodayPrices] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('price_desc');
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => { fetchPrices(); }, []);

  async function fetchPrices() {
    setLoading(true);

    // 获取最新一天的价格
    const { data: dates } = await supabase
      .from('price_history')
      .select('date')
      .order('date', { ascending: false })
      .limit(1);

    const latestDate = dates?.[0]?.date;
    if (!latestDate) { setLoading(false); return; }

    const { data: today } = await supabase
      .from('price_history')
      .select('*')
      .eq('date', latestDate)
      .order('avg_price', { ascending: false });

    setTodayPrices(today || []);
    setLastUpdate(latestDate);

    // 获取历史数据（最近30天）
    const { data: history } = await supabase
      .from('price_history')
      .select('object_id, object_name, avg_price, date')
      .order('date', { ascending: true })
      .limit(10000);

    setHistoryData(history || []);
    setLoading(false);
  }

  // 搜索和筛选
  const filtered = useMemo(() => {
    let items = todayPrices;
    if (selectedCat !== 'all') items = items.filter(i => i.category === selectedCat);
    if (search.trim()) items = items.filter(i => i.object_name.toLowerCase().includes(search.toLowerCase()));

    items.sort((a, b) => {
      if (sortBy === 'price_desc') return b.avg_price - a.avg_price;
      if (sortBy === 'price_asc') return a.avg_price - b.avg_price;
      if (sortBy === 'name') return a.object_name.localeCompare(b.object_name);
      return 0;
    });
    return items;
  }, [todayPrices, selectedCat, search, sortBy]);

  // 选中物品的历史数据
  const itemHistory = useMemo(() => {
    if (!selectedItem) return [];
    return historyData
      .filter(h => h.object_id === selectedItem.object_id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedItem, historyData]);

  function formatPrice(n) {
    if (!n && n !== 0) return '-';
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toLocaleString();
  }

  function formatFullPrice(n) {
    if (!n && n !== 0) return '-';
    return n.toLocaleString() + ' ₳';
  }

  function formatTime(d) {
    if (!d) return '';
    return d;
  }

  // 迷你折线图
  function MiniChart({ data, color, width = 120, height = 40 }) {
    if (!data || data.length < 2) return null;
    const prices = data.map(d => d.avg_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 大折线图
  function BigChart({ data, color }) {
    if (!data || data.length < 2) return (
      <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>
        需要至少2天数据才能显示走势图<br/>系统每天自动记录价格，过几天就有图了
      </div>
    );

    const prices = data.map(d => d.avg_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 600, h = 200, pad = 40;

    const points = prices.map((p, i) => {
      const x = pad + (i / (prices.length - 1)) * (w - pad * 2);
      const y = pad / 2 + (1 - (p - min) / range) * (h - pad);
      return [x, y];
    });
    const polyline = points.map(p => p.join(',')).join(' ');
    const area = `${pad},${h - pad / 2} ${polyline} ${w - pad},${h - pad / 2}`;

    return (
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: '100%', maxWidth: 600, height: 'auto' }}>
          {/* 网格线 */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = pad / 2 + (1 - pct) * (h - pad);
            const val = min + pct * range;
            return (
              <g key={pct}>
                <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="rgba(100,150,180,0.15)" strokeDasharray="3" />
                <text x={pad - 5} y={y + 4} textAnchor="end" fill="#6898b0" fontSize="10">{formatPrice(val)}</text>
              </g>
            );
          })}
          {/* 面积 */}
          <polygon points={area} fill={`${color}10`} />
          {/* 折线 */}
          <polyline points={polyline} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* 数据点 */}
          {points.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="var(--bg-card)" stroke={color} strokeWidth="2" />
              <text x={x} y={h + 14} textAnchor="middle" fill="#6898b0" fontSize="8" transform={`rotate(-30 ${x} ${h + 14})`}>
                {data[i].date.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (loading) return <div className="loading"><div className="spinner"></div>加载价格数据中...</div>;

  return (
    <div>
      <SEO title="价格走势图" path="/prices" description="三角洲行动物品价格走势图，实时追踪枪械、护甲、配件等物品的历史价格变化。" />
      <h1 className="page-title">价格走势图</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
        更新日期：{formatTime(lastUpdate) || '暂无数据'} · 共 {todayPrices.length} 个物品
      </p>

      {/* 详情弹窗 */}
      {selectedItem && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 14,
          padding: 20, marginBottom: 20, position: 'relative',
        }}>
          <button onClick={() => setSelectedItem(null)} style={{
            position: 'absolute', top: 12, right: 14, background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer',
          }}>✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            {selectedItem.image_url && (
              <img src={selectedItem.image_url} alt="" style={{
                width: 56, height: 56, objectFit: 'contain', borderRadius: 10,
                background: 'linear-gradient(135deg, #1a2a3a, #1e3040)', border: '1px solid var(--border)', padding: 4,
              }} onError={e => e.target.style.display = 'none'} />
            )}
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedItem.object_name}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                {selectedItem.category && (
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600,
                    background: `${CAT_COLORS[selectedItem.category] || '#20e870'}15`,
                    color: CAT_COLORS[selectedItem.category] || '#20e870',
                    border: `1px solid ${CAT_COLORS[selectedItem.category] || '#20e870'}30`,
                  }}>{selectedItem.category}</span>
                )}
                <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Orbitron', monospace", color: '#20e870' }}>
                  {formatFullPrice(selectedItem.avg_price)}
                </span>
              </div>
            </div>
          </div>

          <BigChart data={itemHistory} color={CAT_COLORS[selectedItem.category] || '#20e870'} />
        </div>
      )}

      {/* 筛选 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {CATEGORIES.map(c => (
          <button key={c.key} className={`filter-chip ${selectedCat === c.key ? 'active' : ''}`}
            onClick={() => setSelectedCat(c.key)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="search-row">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索物品名称..." />
        </div>
        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="price_desc">价格 高→低</option>
          <option value="price_asc">价格 低→高</option>
          <option value="name">名称排序</option>
        </select>
      </div>

      {/* 物品列表 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📈</div>
          <p style={{ fontSize: 18, marginBottom: 8 }}>暂无价格数据</p>
          <p style={{ fontSize: 14 }}>请管理员在后台获取价格数据</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {filtered.map(item => {
            const color = CAT_COLORS[item.category] || '#20e870';
            const itemHist = historyData.filter(h => h.object_id === item.object_id).sort((a, b) => a.date.localeCompare(b.date));
            const prevPrice = itemHist.length >= 2 ? itemHist[itemHist.length - 2].avg_price : null;
            const change = prevPrice ? item.avg_price - prevPrice : null;
            const changePct = prevPrice ? ((change / prevPrice) * 100).toFixed(1) : null;

            return (
              <div key={item.id} onClick={() => setSelectedItem(item)}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer', transition: 'border-color 0.15s',
                  flexWrap: 'wrap',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${color}50`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* 图片 */}
                {item.image_url && (
                  <img src={item.image_url} alt="" style={{
                    width: 40, height: 40, objectFit: 'contain', borderRadius: 6,
                    background: 'linear-gradient(135deg, #1a2a3a, #1e3040)',
                    border: '1px solid var(--border)', padding: 2, flexShrink: 0,
                  }} onError={e => e.target.style.display = 'none'} />
                )}

                {/* 名称 */}
                <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.object_name}
                  </div>
                  {item.category && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 6, fontWeight: 600,
                      background: `${color}12`, color, border: `1px solid ${color}25`,
                    }}>{item.category}</span>
                  )}
                </div>

                {/* 迷你图 */}
                <div style={{ flexShrink: 0 }}>
                  <MiniChart data={itemHist} color={color} />
                </div>

                {/* 价格 */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                  <div style={{
                    fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
                  }}>
                    {formatPrice(item.avg_price)}
                  </div>
                  {change !== null && (
                    <div style={{
                      fontSize: 11, fontWeight: 600,
                      color: change > 0 ? '#e04848' : change < 0 ? '#20e870' : 'var(--text-muted)',
                    }}>
                      {change > 0 ? '↑' : change < 0 ? '↓' : '—'} {changePct}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: 28, padding: 16, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 10,
        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8,
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>💡 说明：</strong>
        价格为交易行均价，每天自动更新。点击物品可查看历史走势图。涨跌幅对比前一天数据。
        数据积累越多，走势图越完整。
      </div>
    </div>
  );
}

export default PriceTrend;
