import React from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useT } from '../i18n';

// Page navigation docked at the bottom of the page, right above the site
// footer. Put it as the last child of a `.page-fill` container (see
// styles/index.css): it is pushed to the bottom there and stays sticky to the
// bottom of the screen while scrolling long pages.
export default function Pager({ page, pageCount, onChange }) {
  const { t } = useT();
  if (pageCount <= 1) return null;
  const go = p => {
    if (p < 1 || p > pageCount || p === page) return;
    onChange(p);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
  };
  return (
    <div className="pager-dock">
      <div className="pager">
        <button className="filter-chip" disabled={page <= 1} onClick={() => go(page - 1)}><IconChevronLeft size={15} />{t('上一页')}</button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
          <button key={p} className={`filter-chip pager-num ${p === page ? 'active' : ''}`} onClick={() => go(p)}>{p}</button>
        ))}
        <button className="filter-chip" disabled={page >= pageCount} onClick={() => go(page + 1)}>{t('下一页')}<IconChevronRight size={15} /></button>
        <span className="pager-info">{t('第 {p} / {n} 页', { p: page, n: pageCount })}</span>
      </div>
    </div>
  );
}
