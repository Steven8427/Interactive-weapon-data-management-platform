import { Helmet } from 'react-helmet-async';
import { useT } from '../i18n';

const SITE = 'https://guns.yufantechs.com';
const SITE_NAME_ZH = '有力气的改枪网站';
const DEFAULT_IMG = `${SITE}/logo.png`;

const OG_LOCALE = { zh: 'zh_CN', 'zh-TW': 'zh_TW', en: 'en_US', ja: 'ja_JP', ko: 'ko_KR' };

export default function SEO({ title, description, path = '/', image }) {
  const { t, lang } = useT();
  const siteName = t(SITE_NAME_ZH);
  const fullTitle = title ? `${title} - ${siteName}` : `${siteName} - ${t('三角洲行动改枪码大全')}`;
  const url = `${SITE}${path}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image || DEFAULT_IMG} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={OG_LOCALE[lang] || 'zh_CN'} />
    </Helmet>
  );
}
