import { Helmet } from 'react-helmet-async';
import { useT } from '../i18n';

const SITE_NAME_ZH = '有力气的改枪网站';

// Per-URL SEO (canonical, hreflang, description, OG, JSON-LD) is emitted as
// static HTML per route/language by scripts/generate-seo.js — that is what
// crawlers and social scrapers read (they fetch each URL fresh). Here we only
// keep <html lang> and <title> in sync for in-session client navigation, to
// avoid duplicate canonical/meta tags that hurt indexing.
export default function SEO({ title, description, path = '/', image }) {
  const { t, lang } = useT();
  const siteName = t(SITE_NAME_ZH);
  const fullTitle = title ? `${title} - ${siteName}` : `${siteName} - ${t('三角洲行动改枪码大全')}`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
    </Helmet>
  );
}
