import React, { useState } from 'react';
import SEO from '../components/SEO';

const MAP_URL = 'https://df.qq.com/cp/a20240729directory/';

function MapTool() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div>
      <SEO title="官方地图工具" path="/map" description="三角洲行动官方互动地图，查看物资点、出生点、撤离点、首领坐标等关键信息。" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">官方地图工具</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            三角洲行动官方互动地图 · 物资点 · 出生点 · 撤离点 · 首领坐标
          </p>
        </div>
        <a href={MAP_URL} target="_blank" rel="noopener noreferrer"
          className="btn btn-primary" style={{ textDecoration: 'none', flexShrink: 0 }}>
          🔗 新窗口打开
        </a>
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 180px)',
        minHeight: 500,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}>
        {loading && !error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-card)', zIndex: 2,
          }}>
            <div className="spinner" style={{ marginRight: 10 }}></div>
            <span style={{ color: 'var(--text-muted)' }}>加载地图中...</span>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-card)', zIndex: 2, padding: 40, textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🗺️</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              地图无法嵌入显示
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 400 }}>
              官方地图可能不支持嵌入，请点击下方按钮直接访问
            </p>
            <a href={MAP_URL} target="_blank" rel="noopener noreferrer"
              className="btn btn-primary" style={{ textDecoration: 'none', fontSize: 16, padding: '12px 24px' }}>
              🗺️ 打开官方地图工具
            </a>
          </div>
        )}

        <iframe
          src={MAP_URL}
          title="三角洲行动地图工具"
          style={{
            width: '100%', height: '100%', border: 'none',
            display: error ? 'none' : 'block',
          }}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
        />
      </div>

      <div style={{
        marginTop: 16, padding: 14, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 10,
        fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8,
      }}>
        <strong style={{ color: 'var(--text-secondary)' }}>💡 提示：</strong>
        地图数据来自腾讯官方。如果显示异常，点击右上角"新窗口打开"直接访问。
      </div>
    </div>
  );
}

export default MapTool;