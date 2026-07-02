/* eslint-disable */
// Post-build SEO prerender: for every route, emit a static HTML file with
// route-specific <title>/description/canonical/OG, hreflang alternates,
// route JSON-LD, and a keyword-rich static content block inside #root.
// Googlebot reads real content without executing JS; the React app boots
// normally and createRoot() replaces the #root children on mount.
const fs = require('fs');
const path = require('path');

const SITE = 'https://guns.yufantechs.com';
const BUILD = path.join(__dirname, '..', 'build');
const LASTMOD = new Date().toISOString().slice(0, 10);

// hreflang codes -> ?lang value ('' = default url, no param)
const HREFLANGS = [
  { hreflang: 'zh-Hans', q: '' },
  { hreflang: 'zh-Hant', q: 'zh-TW' },
  { hreflang: 'en', q: 'en' },
  { hreflang: 'ja', q: 'ja' },
  { hreflang: 'ko', q: 'ko' },
  { hreflang: 'x-default', q: '' },
];

// Per-route SEO metadata + Chinese keyword-rich static content.
const ROUTES = [
  {
    path: '/',
    title: '有力气的改枪网站 - 三角洲改枪码大全 | 三角洲行动改枪 · 每日密码 · 制造利润',
    desc: '三角洲改枪码大全，三角洲行动(Delta Force)最全工具站：官方热门改枪码、主播同款改枪码、每日密码、特勤处制造利润、物品价格走势、卡战备推荐，一键复制改枪码。',
    h1: '有力气的改枪网站 — 三角洲改枪码大全',
    intro: '专注三角洲行动(Delta Force)改枪的一站式工具站。收录官方热门改枪码、主播同款改枪码，提供每日密码查询、特勤处制造利润计算、物品价格走势图与卡战备配装推荐。所有三角洲改枪码均可一键复制，直接导入游戏。',
    prio: '1.0', freq: 'daily',
  },
  {
    path: '/streamers',
    title: '主播同款改枪码 - 三角洲改枪 | 有力气的改枪网站',
    desc: '三角洲行动主播同款改枪码合集，36+ 位人气主播的三角洲改枪方案，武器配置与配件一键复制使用。',
    h1: '三角洲行动主播同款改枪码',
    intro: '汇集三角洲行动众多人气主播的同款改枪码与武器配置方案。按主播浏览其全部三角洲改枪码，查看配件明细与价格，一键复制导入游戏。',
    prio: '0.9', freq: 'daily',
  },
  {
    path: '/official',
    title: '官方热门改枪码 - 三角洲行动改枪排行 | 有力气的改枪网站',
    desc: '三角洲行动官方社区热门改枪码，按使用量排行，含完整配件列表与价格，每 6 小时自动同步更新。',
    h1: '三角洲行动官方热门改枪码',
    intro: '实时同步三角洲行动官方社区的热门改枪码，按使用量与点赞排序，附完整配件清单和交易行价格。找当前最强三角洲改枪方案，一键复制。',
    prio: '0.9', freq: 'daily',
  },
  {
    path: '/community',
    title: '玩家社区 - 三角洲改枪码分享 | 有力气的改枪网站',
    desc: '三角洲行动玩家改枪码分享社区，注册即可发布你的三角洲改枪方案，交流改枪心得，浏览其他玩家的武器配置。',
    h1: '三角洲行动玩家改枪社区',
    intro: '玩家自建的三角洲改枪码分享社区。注册后可发布自己的武器改枪方案，浏览、复制其他玩家分享的三角洲行动改枪码。',
    prio: '0.8', freq: 'daily',
  },
  {
    path: '/daily',
    title: '每日密码 - 三角洲行动地图密码查询 | 有力气的改枪网站',
    desc: '三角洲行动每日地图密码查询，零号大坝、长弓溪谷、巴克什、航天基地、潮汐监狱、AZ3 每日更新，点击即可复制。',
    h1: '三角洲行动每日密码',
    intro: '每日更新三角洲行动各地图的电台/门禁密码，覆盖零号大坝、长弓溪谷、巴克什、航天基地、潮汐监狱、AZ3 等地图，点击卡片即可复制。',
    prio: '0.8', freq: 'daily',
  },
  {
    path: '/profit',
    title: '特勤处制造利润 - 三角洲行动制造赚钱 | 有力气的改枪网站',
    desc: '三角洲行动特勤处制造利润计算器，实时成本与收益分析，找到最赚钱的制造方案（技术中心、工作台、制药台、防具台）。',
    h1: '三角洲行动特勤处制造利润',
    intro: '实时计算三角洲行动特勤处各制造台（技术中心、工作台、制药台、防具台）的制造利润，按每小时收益排序，帮你找到最赚钱的制造方案。',
    prio: '0.8', freq: 'hourly',
  },
  {
    path: '/prices',
    title: '价格走势图 - 三角洲行动物价查询 | 有力气的改枪网站',
    desc: '三角洲行动物品价格走势图，实时追踪枪械、护甲、配件、子弹等物品的历史价格变化与涨跌幅。',
    h1: '三角洲行动物品价格走势',
    intro: '追踪三角洲行动交易行物品价格走势，涵盖枪械、护甲、配件、子弹与医疗物资，查看历史价格曲线与每日涨跌幅。',
    prio: '0.7', freq: 'daily',
  },
  {
    path: '/items',
    title: '物品图鉴 - 三角洲行动物品数据库 | 有力气的改枪网站',
    desc: '三角洲行动全物品图鉴百科，收录所有枪械、配件、护甲、装备的详细信息、品级与价格，支持搜索筛选。',
    h1: '三角洲行动物品图鉴',
    intro: '三角洲行动全物品数据库，收录枪械、配件、护甲、装备等物品的品级、属性、产出地与参考价格，支持按分类与品级搜索。',
    prio: '0.7', freq: 'weekly',
  },
  {
    path: '/cards',
    title: '卡战备系统 - 三角洲行动配装推荐 | 有力气的改枪网站',
    desc: '三角洲行动卡战备配装推荐，不同预算档位的最优枪械、护甲、装备与配件搭配方案，含改枪码。',
    h1: '三角洲行动卡战备配装',
    intro: '按预算档位推荐三角洲行动的卡战备配装方案，给出最优枪械、护甲、装备与配件组合及对应改枪码，兼顾性价比。',
    prio: '0.7', freq: 'hourly',
  },
  {
    path: '/map',
    title: '官方地图工具 - 三角洲行动互动地图 | 有力气的改枪网站',
    desc: '三角洲行动官方互动地图，查看物资点、出生点、撤离点、首领坐标等关键信息。',
    h1: '三角洲行动官方地图工具',
    intro: '内嵌三角洲行动官方互动地图，查看各地图的物资点、出生点、撤离点与首领坐标，规划路线。',
    prio: '0.6', freq: 'weekly',
  },
  {
    path: '/legal',
    title: '法律声明 - 隐私政策与使用条款 | 有力气的改枪网站',
    desc: '有力气的改枪网站的隐私政策、使用条款和 Cookie 政策。',
    h1: '法律声明',
    intro: '有力气的改枪网站的隐私政策、使用条款与 Cookie 政策说明。',
    prio: '0.3', freq: 'monthly',
  },
];

const BASE_KEYWORDS = '三角洲改枪,三角洲改枪码,三角洲行动改枪,三角洲行动改枪码,有力气的改枪网站,Delta Force,改枪码大全,每日密码,制造利润,价格走势,卡战备,烽火地带,特勤处';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function hreflangTags(routePath) {
  const clean = routePath === '/' ? '/' : routePath;
  return HREFLANGS.map(l => {
    const href = SITE + clean + (l.q ? (clean.includes('?') ? '&' : '?') + 'lang=' + l.q : '');
    return `<link rel="alternate" hreflang="${l.hreflang}" href="${href}"/>`;
  }).join('');
}

function jsonLd(r) {
  const url = SITE + r.path;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: r.h1,
    description: r.desc,
    url,
    inLanguage: 'zh-CN',
    isPartOf: { '@type': 'WebSite', name: '有力气的改枪网站', url: SITE + '/' },
    publisher: { '@type': 'Organization', name: 'YufanTechs' },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function seoBlock(r) {
  const links = ROUTES.filter(x => x.path !== r.path && x.path !== '/legal')
    .map(x => `<li><a href="${x.path}">${esc(x.h1)}</a></li>`).join('');
  return `<div id="seo-prerender">`
    + `<h1>${esc(r.h1)}</h1>`
    + `<p>${esc(r.intro)}</p>`
    + `<nav aria-label="站内导航"><ul>${links}</ul></nav>`
    + `</div>`;
}

function buildPage(template, r) {
  let html = template;
  const url = SITE + r.path;
  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`);
  // description
  html = html.replace(/(<meta name="description" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(r.desc)}$2`);
  // keywords
  html = html.replace(/(<meta name="keywords" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(BASE_KEYWORDS)}$2`);
  // canonical
  html = html.replace(/(<link rel="canonical" href=")[\s\S]*?("\s*\/?>)/, `$1${url}$2`);
  // og:title / og:description / og:url
  html = html.replace(/(<meta property="og:title" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(r.title)}$2`);
  html = html.replace(/(<meta property="og:description" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(r.desc)}$2`);
  html = html.replace(/(<meta property="og:url" content=")[\s\S]*?("\s*\/?>)/, `$1${url}$2`);
  // inject hreflang + route JSON-LD before </head>
  html = html.replace('</head>', `${hreflangTags(r.path)}${jsonLd(r)}</head>`);
  // inject SEO content inside #root (React replaces it on mount)
  html = html.replace(/(<div id="root">)(<\/div>)/, `$1${seoBlock(r)}$2`);
  return html;
}

function main() {
  const templatePath = path.join(BUILD, 'index.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  let count = 0;
  for (const r of ROUTES) {
    const html = buildPage(template, r);
    let outFile;
    if (r.path === '/') outFile = path.join(BUILD, 'index.html');
    else { const dir = path.join(BUILD, r.path.replace(/^\//, '')); fs.mkdirSync(dir, { recursive: true }); outFile = path.join(dir, 'index.html'); }
    fs.writeFileSync(outFile, html, 'utf8');
    count++;
  }

  // Regenerate sitemap.xml with hreflang alternates.
  const xhtml = 'xmlns:xhtml="http://www.w3.org/1999/xhtml"';
  const urls = ROUTES.map(r => {
    const loc = SITE + r.path;
    const alts = HREFLANGS.filter(l => l.hreflang !== 'x-default').map(l => {
      const href = loc + (l.q ? '?lang=' + l.q : '');
      return `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${href}"/>`;
    }).join('\n');
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${r.freq}</changefreq>\n    <priority>${r.prio}</priority>\n${alts}\n  </url>`;
  }).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${xhtml}>\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`[generate-seo] wrote ${count} route HTML files + sitemap.xml (lastmod ${LASTMOD})`);
}

main();
