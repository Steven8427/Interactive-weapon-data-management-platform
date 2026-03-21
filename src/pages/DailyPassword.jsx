import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';

const MAPS = [
  { id: 1, name: '零号大坝', icon: '🏗️', color: '#20e870' },
  { id: 2, name: '长弓溪谷', icon: '🏔️', color: '#18a0d0' },
  { id: 3, name: '巴克什', icon: '🏜️', color: '#e0a030' },
  { id: 4, name: '航天基地', icon: '🚀', color: '#d050d0' },
  { id: 5, name: '潮汐监狱', icon: '⛓️', color: '#e06040' },
];

function DailyPassword() {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => { fetchPasswords(); }, []);

  async function fetchPasswords() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    let { data } = await supabase
      .from('daily_passwords')
      .select('*')
      .eq('date', today)
      .order('map_id', { ascending: true });

    if (!data || data.length === 0) {
      const { data: latest } = await supabase
        .from('daily_passwords')
        .select('*')
        .order('date', { ascending: false })
        .order('map_id', { ascending: true })
        .limit(10);
      data = latest || [];
    }

    setPasswords(data);
    if (data.length > 0) setLastUpdate(data[0].updated_at || data[0].date);
    setLoading(false);
  }

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function copyPw(secret, name) {
    navigator.clipboard.writeText(secret).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = secret; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    });
    setCopied(name);
    toast.success(`${name} 密码已复制！`);
    setTimeout(() => setCopied(''), 1500);
  }

  // 把密码拆成单个数字显示
  function renderDigits(secret, color) {
    return (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {secret.split('').map((digit, i) => (
          <div key={i} style={{
            width: 48, height: 58,
            background: 'var(--bg-secondary)',
            border: `2px solid ${color}40`,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Orbitron', monospace",
            fontSize: 30, fontWeight: 900,
            color: color,
            textShadow: `0 0 12px ${color}40`,
          }}>
            {digit}
          </div>
        ))}
      </div>
    );
  }

  if (loading) return <div className="loading"><div className="spinner"></div>加载每日密码中...</div>;

  const latestDate = passwords.length > 0 ? passwords[0].date : '';
  const todayPw = passwords.filter(p => p.date === latestDate);
  const isToday = latestDate === new Date().toISOString().split('T')[0];

  return (
    <div>
      <SEO title="每日密码" path="/daily" description="三角洲行动每日地图密码查询，零号大坝、长弓溪谷、巴克什、航天基地、潮汐监狱每日更新。" />
      <h1 className="page-title">每日密码</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        更新时间：{formatTime(lastUpdate) || '暂无数据'}
        {latestDate && !isToday && (
          <span style={{ color: 'var(--danger)', marginLeft: 8, fontSize: 12 }}>（非今日数据）</span>
        )}
      </p>

      {todayPw.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔑</div>
          <p style={{ fontSize: 18, marginBottom: 8 }}>今日密码暂未更新</p>
          <p style={{ fontSize: 14 }}>密码每天 00:00 自动更新，请稍后再来查看</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 16,
        }}>
          {todayPw.map(pw => {
            const map = MAPS.find(m => m.name === pw.map_name) || { icon: '🗺️', color: '#20e870' };
            const isCopied = copied === pw.map_name;
            return (
              <div key={pw.id} onClick={() => copyPw(pw.secret, pw.map_name)}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isCopied ? map.color : 'var(--border)'}`,
                  borderRadius: 16, padding: '26px 20px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  textAlign: 'center', position: 'relative', overflow: 'hidden',
                  transform: isCopied ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = map.color; e.currentTarget.style.boxShadow = `0 4px 24px ${map.color}18`; }}
                onMouseLeave={e => { if (!isCopied) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                {/* 顶部渐变条 */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${map.color}, ${map.color}66)` }} />

                <div style={{ fontSize: 32, marginBottom: 8 }}>{map.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  {pw.map_name}
                </div>

                {/* 每位数字单独显示 */}
                {renderDigits(pw.secret, map.color)}

                <div style={{
                  marginTop: 14, fontSize: 12,
                  color: isCopied ? map.color : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                  {isCopied ? '✅ 已复制' : '点击复制密码'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: 30, padding: 16, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 10,
        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8,
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>💡 提示：</strong>
        密码每天 00:00 自动更新。点击密码卡片可以快速复制。
      </div>
    </div>
  );
}

export default DailyPassword;