import { Helmet } from 'react-helmet-async';

const SITE = 'https://guns.yufantechs.com';
const SITE_NAME = '有力气的改枪网站';
const DEFAULT_IMG = `${SITE}/logo.png`;

export default function SEO({ title, description, path = '/', image }) {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - 三角洲行动改枪码大全`;
  const url = `${SITE}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image || DEFAULT_IMG} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="zh_CN" />
    </Helmet>
  );
}
