/* eslint-disable */
// Post-build SEO prerender. For every route AND every language, emit a
// static HTML file (build[/<langprefix>]/<route>/index.html) with a
// language-specific <title>/description/keywords/canonical/OG, correct
// <html lang> + og:locale, hreflang alternates, route JSON-LD, and a
// keyword-rich static content block inside #root. Googlebot reads real,
// per-language content without executing JS; React's createRoot replaces
// the block on mount so real users see the SPA.
const fs = require('fs');
const path = require('path');
const CONTENT = require('./seo-content');
const { gunSlug, weaponModel } = require('./gun-slug');

const SITE = 'https://guns.yufantechs.com';
const BUILD = path.join(__dirname, '..', 'build');
const LASTMOD = new Date().toISOString().slice(0, 10);
const TOP_WEAPONS = 40; // how many weapon landing pages to generate

// lang code -> { prefix (url segment, '' for zh), hreflang, ogLocale, htmlLang }
const LANGS = [
  { code: 'zh',    prefix: '',        hreflang: 'zh-Hans', ogLocale: 'zh_CN', htmlLang: 'zh-CN' },
  { code: 'zh-TW', prefix: '/zh-tw',  hreflang: 'zh-Hant', ogLocale: 'zh_TW', htmlLang: 'zh-TW' },
  { code: 'en',    prefix: '/en',     hreflang: 'en',      ogLocale: 'en_US', htmlLang: 'en' },
  { code: 'ja',    prefix: '/ja',     hreflang: 'ja',      ogLocale: 'ja_JP', htmlLang: 'ja' },
  { code: 'ko',    prefix: '/ko',     hreflang: 'ko',      ogLocale: 'ko_KR', htmlLang: 'ko' },
];

const KEYWORDS = {
  zh: '三角洲改枪,三角洲改枪码,三角洲行动改枪,三角洲行动改枪码,有力气的改枪网站,Delta Force,改枪码大全,每日密码,制造利润,价格走势,卡战备',
  'zh-TW': '三角洲改槍,三角洲改槍碼,三角洲行動改槍,三角洲行動改槍碼,有力氣的改槍網站,Delta Force,改槍碼大全,每日密碼,製造利潤,價格走勢,卡戰備',
  en: 'Delta Force gun codes, Delta Force builds, build codes, daily codes, crafting profit, price trends, loadout, streamer builds',
  ja: 'デルタフォース 改造コード, Delta Force, ビルドコード, 毎日のコード, 製造利益, 価格推移, 装備, 配信者',
  ko: '델타포스 건 코드, Delta Force, 세팅 코드, 일일 코드, 제작 수익, 가격 추이, 장비, 스트리머',
};

const ROUTE_PATHS = Object.keys(CONTENT);

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function urlFor(prefix, routePath) { return SITE + prefix + (routePath === '/' ? '/' : routePath); }

function hreflangTags(routePath) {
  const tags = LANGS.map(l => `<link rel="alternate" hreflang="${l.hreflang}" href="${urlFor(l.prefix, routePath)}"/>`);
  tags.push(`<link rel="alternate" hreflang="x-default" href="${urlFor('', routePath)}"/>`);
  return tags.join('');
}

function jsonLd(lang, routePath, c) {
  const data = {
    '@context': 'https://schema.org', '@type': 'WebPage',
    name: c.h1, description: c.desc, url: urlFor(lang.prefix, routePath),
    inLanguage: lang.htmlLang,
    isPartOf: { '@type': 'WebSite', name: '有力气的改枪网站', alternateName: 'Delta Force Gun Codes', url: SITE + '/' },
    publisher: { '@type': 'Organization', name: 'YufanTechs' },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function seoBlock(lang, routePath, c) {
  let links = ROUTE_PATHS
    .filter(p => p !== routePath && p !== '/legal')
    .map(p => `<li><a href="${lang.prefix}${p}">${esc(CONTENT[p][lang.code].h1)}</a></li>`)
    .join('');
  // link the (zh) weapon hub for crawl discovery
  if (lang.code === 'zh') links += `<li><a href="/gun">三角洲行动武器改枪码大全</a></li>`;
  return `<div id="seo-prerender"><h1>${esc(c.h1)}</h1><p>${esc(c.intro)}</p><nav><ul>${links}</ul></nav></div>`;
}

function buildPage(template, lang, routePath, c) {
  let html = template;
  const url = urlFor(lang.prefix, routePath);
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang.htmlLang}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(c.title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(c.desc)}$2`);
  html = html.replace(/(<meta name="keywords" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(KEYWORDS[lang.code])}$2`);
  html = html.replace(/(<link rel="canonical" href=")[\s\S]*?("\s*\/?>)/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:title" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(c.title)}$2`);
  html = html.replace(/(<meta property="og:description" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(c.desc)}$2`);
  html = html.replace(/(<meta property="og:url" content=")[\s\S]*?("\s*\/?>)/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:locale" content=")[\s\S]*?("\s*\/?>)/, `$1${lang.ogLocale}$2`);
  html = html.replace('</head>', `${hreflangTags(routePath)}${jsonLd(lang, routePath, c)}</head>`);
  html = html.replace(/(<div id="root">)(<\/div>)/, `$1${seoBlock(lang, routePath, c)}$2`);
  return html;
}

// --- Weapon landing pages (zh, sourced from Supabase at build time) ---
function readEnv() {
  let url = process.env.REACT_APP_SUPABASE_URL;
  let key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  try {
    const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    url = url || (env.match(/REACT_APP_SUPABASE_URL=(.+)/) || [])[1];
    key = key || (env.match(/REACT_APP_SUPABASE_ANON_KEY=(.+)/) || [])[1];
  } catch (e) { /* ignore */ }
  return { url: (url || '').trim(), key: (key || '').trim() };
}

async function fetchWeapons() {
  const { url, key } = readEnv();
  if (!url || !key) return [];
  const q = url + '/rest/v1/official_gun_codes?select=name,arms_name,arms_category,arms_pic,solution_code,author_nickname,apply_num&order=apply_num.desc&limit=2000';
  const res = await fetch(q, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (!res.ok) throw new Error('supabase ' + res.status);
  const rows = (await res.json()).filter(r => r.is_hidden !== true && r.arms_name);
  const map = {};
  for (const c of rows) {
    const s = gunSlug(c.arms_name);
    if (!s) continue;
    if (!map[s]) map[s] = { slug: s, model: weaponModel(c.arms_name), category: c.arms_category, pic: c.arms_pic, codes: [], apply: 0 };
    map[s].codes.push(c);
    map[s].apply += (c.apply_num || 0);
    if (!map[s].pic && c.arms_pic) map[s].pic = c.arms_pic;
  }
  return Object.values(map).sort((a, b) => b.apply - a.apply).slice(0, TOP_WEAPONS);
}

function buildGunPage(template, { url, title, desc, h1, bodyHtml }) {
  let html = template;
  html = html.replace(/<html lang="[^"]*"/, '<html lang="zh-CN"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(desc)}$2`);
  html = html.replace(/(<meta name="keywords" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(KEYWORDS.zh)}$2`);
  html = html.replace(/(<link rel="canonical" href=")[\s\S]*?("\s*\/?>)/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:title" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(title)}$2`);
  html = html.replace(/(<meta property="og:description" content=")[\s\S]*?("\s*\/?>)/, `$1${esc(desc)}$2`);
  html = html.replace(/(<meta property="og:url" content=")[\s\S]*?("\s*\/?>)/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:locale" content=")[\s\S]*?("\s*\/?>)/, `$1zh_CN$2`);
  const jsonld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: h1, description: desc, url, inLanguage: 'zh-CN', isPartOf: { '@type': 'WebSite', name: '有力气的改枪网站', url: SITE + '/' } })}</script>`;
  html = html.replace('</head>', `${jsonld}</head>`);
  html = html.replace(/(<div id="root">)(<\/div>)/, `$1<div id="seo-prerender">${bodyHtml}</div>$2`);
  return html;
}

function writeHtml(relPath, html) {
  const dir = relPath ? path.join(BUILD, relPath) : BUILD;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

async function generateGunPages(template) {
  let weapons = [];
  try { weapons = await fetchWeapons(); }
  catch (e) { console.warn('[generate-seo] weapon fetch failed, skipping gun pages:', e.message); return []; }
  if (!weapons.length) return [];
  const urls = [];

  // index /gun
  const idxLinks = weapons.map(w => `<li><a href="/gun/${w.slug}">${esc(w.model)} ${esc('改枪码')}</a></li>`).join('');
  writeHtml('gun', buildGunPage(template, {
    url: SITE + '/gun',
    title: '武器改枪码大全 - 三角洲行动按武器查改枪码 | 有力气的改枪网站',
    desc: '三角洲行动各热门武器改枪码大全，按武器查询官方与主播同款改枪码，一键复制导入游戏。',
    h1: '三角洲行动武器改枪码大全',
    bodyHtml: `<h1>三角洲行动武器改枪码大全</h1><p>按武器查询三角洲行动改枪码，收录 ${weapons.length} 把热门武器的官方与主播同款改枪码。</p><nav><ul>${idxLinks}</ul></nav>`,
  }));
  urls.push(SITE + '/gun');

  // per weapon /gun/<slug>
  for (const w of weapons) {
    const url = `${SITE}/gun/${w.slug}`;
    const codesHtml = w.codes.slice(0, 20).map(c => `<li><strong>${esc(c.name || w.model)}</strong> — <code>${esc(c.solution_code || '')}</code></li>`).join('');
    const body = `<h1>「${esc(w.model)}」三角洲改枪码大全</h1>`
      + `<p>「${esc(w.model)}」（${esc(w.category || '')}）三角洲行动改枪码合集，收录该武器的官方与主播同款改枪码共 ${w.codes.length} 套，点击即可一键复制导入游戏。</p>`
      + `<ul>${codesHtml}</ul>`
      + `<p><a href="/gun">← 更多武器改枪码</a> · <a href="/official">官方热门改枪码</a> · <a href="/streamers">主播同款改枪码</a></p>`;
    writeHtml('gun/' + w.slug, buildGunPage(template, {
      url,
      title: `「${w.model}」改枪码大全 - 三角洲行动${w.model}改枪 | 有力气的改枪网站`,
      desc: `「${w.model}」三角洲改枪码大全，收录 ${w.model} 的官方与主播同款改枪码共 ${w.codes.length} 套，一键复制导入游戏。`,
      h1: `「${w.model}」三角洲改枪码大全`,
      bodyHtml: body,
    }));
    urls.push(url);
  }
  console.log(`[generate-seo] wrote ${weapons.length} weapon pages + /gun index`);
  return urls;
}

async function main() {
  const template = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
  let count = 0;
  for (const routePath of ROUTE_PATHS) {
    const route = CONTENT[routePath];
    for (const lang of LANGS) {
      const c = route[lang.code];
      if (!c) continue;
      const html = buildPage(template, lang, routePath, c);
      const rel = (lang.prefix + (routePath === '/' ? '' : routePath)).replace(/^\//, '');
      const dir = rel ? path.join(BUILD, rel) : BUILD;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
      count++;
    }
  }

  // Weapon landing pages (zh only).
  const gunUrls = await generateGunPages(template);

  // sitemap.xml: localized routes (with hreflang alternates) + weapon pages.
  const xhtmlNs = 'xmlns:xhtml="http://www.w3.org/1999/xhtml"';
  const entries = [];
  for (const routePath of ROUTE_PATHS) {
    const route = CONTENT[routePath];
    for (const lang of LANGS) {
      const loc = urlFor(lang.prefix, routePath);
      const alts = LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${urlFor(l.prefix, routePath)}"/>`)
        .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor('', routePath)}"/>`).join('\n');
      entries.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${route.freq}</changefreq>\n    <priority>${route.prio}</priority>\n${alts}\n  </url>`);
    }
  }
  for (const loc of gunUrls) {
    entries.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${xhtmlNs}>\n${entries.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`[generate-seo] wrote ${count} route/lang HTML files + sitemap (${entries.length} urls, lastmod ${LASTMOD})`);
}

main().catch(e => { console.error('[generate-seo] failed:', e); process.exit(1); });
