import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';

const TABS = [
  { key: 'privacy', label: '🔒 隐私政策' },
  { key: 'terms', label: '📜 使用条款' },
  { key: 'cookie', label: '🍪 Cookie 政策' },
];

function Legal() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'privacy');

  const s = { section: { marginBottom: 24 }, h2: { fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, marginTop: 24 }, h3: { fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, marginTop: 16 }, p: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 10 }, ul: { paddingLeft: 20, marginBottom: 10 }, li: { fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 4 } };

  return (
    <div>
      <SEO title="法律声明" path="/legal" description="有力气的改枪网站的隐私政策、使用条款和Cookie政策。" />
      <h1 className="page-title">📋 法律声明</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>最后更新：2026年3月13日</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} className={`filter-chip ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px' }}>

        {/* ===== 隐私政策 ===== */}
        {tab === 'privacy' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>隐私政策</h1>
            
            <p style={s.p}>欢迎访问有力气的改枪网站（以下简称"本站"，网址：guns.yufantechs.com）。本站由 YufanTechs 运营。我们非常重视您的隐私，本隐私政策旨在说明我们如何收集、使用和保护您的信息。</p>

            <h2 style={s.h2}>1. 信息收集</h2>
            <h3 style={s.h3}>1.1 您主动提供的信息</h3>
            <ul style={s.ul}>
              <li style={s.li}>注册信息：当您在玩家社区注册账号时，我们会收集您的用户名和密码</li>
              <li style={s.li}>发布内容：您发布的改枪码、评论等内容</li>
              <li style={s.li}>管理员信息：管理员登录所需的用户名和密码</li>
            </ul>
            <h3 style={s.h3}>1.2 自动收集的信息</h3>
            <ul style={s.ul}>
              <li style={s.li}>访问日志：包括 IP 地址、浏览器类型、访问时间等基本信息（由 Netlify 托管平台自动记录）</li>
              <li style={s.li}>本站不使用任何第三方分析工具或广告追踪</li>
            </ul>

            <h2 style={s.h2}>2. 信息使用</h2>
            <p style={s.p}>我们收集的信息仅用于以下目的：</p>
            <ul style={s.ul}>
              <li style={s.li}>提供和改善本站服务</li>
              <li style={s.li}>管理用户账号和权限</li>
              <li style={s.li}>展示用户发布的改枪码内容</li>
              <li style={s.li}>维护网站安全和稳定运行</li>
            </ul>

            <h2 style={s.h2}>3. 信息存储与安全</h2>
            <ul style={s.ul}>
              <li style={s.li}>数据存储在 Supabase（加拿大数据中心）提供的安全数据库中</li>
              <li style={s.li}>密码以明文形式存储（注意：我们建议您不要使用与其他重要账号相同的密码）</li>
              <li style={s.li}>我们采取合理的技术措施保护您的数据安全</li>
            </ul>

            <h2 style={s.h2}>4. 信息共享</h2>
            <p style={s.p}>我们不会将您的个人信息出售、出租或以其他方式分享给任何第三方，除非：</p>
            <ul style={s.ul}>
              <li style={s.li}>获得您的明确同意</li>
              <li style={s.li}>法律法规要求</li>
              <li style={s.li}>保护本站或其用户的合法权益</li>
            </ul>

            <h2 style={s.h2}>5. 第三方服务</h2>
            <p style={s.p}>本站使用以下第三方服务：</p>
            <ul style={s.ul}>
              <li style={s.li}>Supabase：数据库和后端服务</li>
              <li style={s.li}>Netlify：网站托管和部署</li>
              <li style={s.li}>腾讯 AMS API：获取游戏相关数据（每日密码、物品价格等）</li>
            </ul>

            <h2 style={s.h2}>6. 您的权利</h2>
            <p style={s.p}>您有权：</p>
            <ul style={s.ul}>
              <li style={s.li}>访问您的个人信息</li>
              <li style={s.li}>删除您的账号和相关数据</li>
              <li style={s.li}>撤回您发布的内容</li>
            </ul>

            <h2 style={s.h2}>7. 未成年人保护</h2>
            <p style={s.p}>本站不针对 13 岁以下的儿童提供服务。如果您发现有未成年人在未经家长同意的情况下提供了个人信息，请联系我们。</p>

            <h2 style={s.h2}>8. 政策更新</h2>
            <p style={s.p}>我们可能会不定期更新本隐私政策。更新后的政策将在本页面发布，建议您定期查看。</p>

            <h2 style={s.h2}>9. 联系我们</h2>
            <p style={s.p}>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
            <ul style={s.ul}>
              <li style={s.li}>网站：guns.yufantechs.com</li>
            </ul>
          </div>
        )}

        {/* ===== 使用条款 ===== */}
        {tab === 'terms' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>使用条款</h1>

            <p style={s.p}>请在使用本站服务之前仔细阅读以下条款。使用本站即表示您同意受这些条款的约束。</p>

            <h2 style={s.h2}>1. 服务说明</h2>
            <p style={s.p}>有力气的改枪网站是一个面向《三角洲行动》（Delta Force）玩家的第三方工具网站，提供以下服务：</p>
            <ul style={s.ul}>
              <li style={s.li}>改枪码分享与浏览</li>
              <li style={s.li}>每日密码查询</li>
              <li style={s.li}>特勤处制造利润计算</li>
              <li style={s.li}>物品价格走势查询</li>
              <li style={s.li}>卡战备推荐系统</li>
              <li style={s.li}>玩家社区功能</li>
            </ul>

            <h2 style={s.h2}>2. 免责声明</h2>
            <ul style={s.ul}>
              <li style={s.li}>本站为非官方第三方工具，与腾讯、Team Jade 或三角洲行动官方无任何关联</li>
              <li style={s.li}>本站提供的数据来源于公开 API，仅供参考，不保证实时性和准确性</li>
              <li style={s.li}>因游戏更新导致的数据偏差，本站不承担任何责任</li>
              <li style={s.li}>使用本站提供的改枪码或其他信息所产生的任何后果，由用户自行承担</li>
            </ul>

            <h2 style={s.h2}>3. 用户行为规范</h2>
            <p style={s.p}>使用本站服务时，您同意：</p>
            <ul style={s.ul}>
              <li style={s.li}>不发布违法、色情、暴力、仇恨或其他不当内容</li>
              <li style={s.li}>不冒充他人或虚假宣传</li>
              <li style={s.li}>不利用本站进行任何商业行为（未经授权）</li>
              <li style={s.li}>不尝试攻击、破坏或干扰本站的正常运行</li>
              <li style={s.li}>不批量爬取或自动化访问本站数据</li>
            </ul>

            <h2 style={s.h2}>4. 知识产权</h2>
            <ul style={s.ul}>
              <li style={s.li}>《三角洲行动》的商标、图像和游戏数据归腾讯及 Team Jade 所有</li>
              <li style={s.li}>本站的界面设计和代码归 YufanTechs 所有</li>
              <li style={s.li}>用户发布的改枪码内容归发布者所有</li>
            </ul>

            <h2 style={s.h2}>5. 账号管理</h2>
            <ul style={s.ul}>
              <li style={s.li}>您有责任保护自己的账号安全</li>
              <li style={s.li}>我们保留在违反使用条款时封禁或删除账号的权利</li>
              <li style={s.li}>长期不活跃的账号可能会被清理</li>
            </ul>

            <h2 style={s.h2}>6. 服务变更与终止</h2>
            <p style={s.p}>我们保留在任何时候修改、暂停或终止本站服务的权利，恕不另行通知。对于服务变更或终止造成的任何损失，本站不承担责任。</p>

            <h2 style={s.h2}>7. 条款修改</h2>
            <p style={s.p}>我们可能会不定期修改本使用条款。修改后的条款将在本页面发布并立即生效。继续使用本站即表示您接受修改后的条款。</p>
          </div>
        )}

        {/* ===== Cookie 政策 ===== */}
        {tab === 'cookie' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Cookie 政策</h1>

            <h2 style={s.h2}>1. 什么是 Cookie</h2>
            <p style={s.p}>Cookie 是网站存储在您浏览器中的小型文本文件，用于记录您的偏好和使用信息。</p>

            <h2 style={s.h2}>2. 本站使用的存储方式</h2>
            <p style={s.p}>本站主要使用浏览器的 LocalStorage（本地存储）来保存以下信息：</p>
            <ul style={s.ul}>
              <li style={s.li}><strong style={{ color: 'var(--text-primary)' }}>玩家登录状态</strong>：记住您的登录信息，避免每次访问都需要重新登录（存储键：df_player）</li>
            </ul>

            <h2 style={s.h2}>3. 本站不使用的技术</h2>
            <ul style={s.ul}>
              <li style={s.li}>本站不使用第三方 Cookie</li>
              <li style={s.li}>本站不使用广告追踪 Cookie</li>
              <li style={s.li}>本站不使用任何分析追踪工具（如 Google Analytics）</li>
              <li style={s.li}>本站不进行跨站追踪</li>
            </ul>

            <h2 style={s.h2}>4. 第三方 Cookie</h2>
            <p style={s.p}>本站嵌入的官方地图工具（iframe）可能会设置来自 df.qq.com 的 Cookie，这些 Cookie 由腾讯控制，不在本站管理范围内。</p>

            <h2 style={s.h2}>5. 如何管理</h2>
            <p style={s.p}>您可以通过以下方式管理存储数据：</p>
            <ul style={s.ul}>
              <li style={s.li}>在玩家社区页面点击"退出"清除登录数据</li>
              <li style={s.li}>在浏览器设置中清除本站的 LocalStorage 数据</li>
              <li style={s.li}>使用浏览器的隐私/无痕模式访问本站</li>
            </ul>

            <h2 style={s.h2}>6. 政策更新</h2>
            <p style={s.p}>如果我们更改了数据存储方式，将更新本 Cookie 政策并在本页面发布。</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Legal;