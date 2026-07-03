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

const SITE = 'https://guns.yufantechs.com';
const BUILD = path.join(__dirname, '..', 'build');
const LASTMOD = new Date().toISOString().slice(0, 10);

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
  const links = ROUTE_PATHS
    .filter(p => p !== routePath && p !== '/legal')
    .map(p => `<li><a href="${lang.prefix}${p}">${esc(CONTENT[p][lang.code].h1)}</a></li>`)
    .join('');
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

function main() {
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

  // sitemap.xml: one <url> per lang x route, each with full hreflang alternates.
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
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${xhtmlNs}>\n${entries.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`[generate-seo] wrote ${count} route/lang HTML files + sitemap (${entries.length} urls, lastmod ${LASTMOD})`);
}

main();
