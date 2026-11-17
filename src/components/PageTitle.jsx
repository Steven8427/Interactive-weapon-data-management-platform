import React from 'react';

// Page heading with an icon badge. The icon sits outside the gradient-clipped
// text (.page-title uses background-clip:text, which would hide an icon).
export default function PageTitle({ icon: Icon, children, style }) {
  return (
    <div className="page-title-wrap" style={style}>
      {Icon && <span className="page-title-icon" aria-hidden="true"><Icon size={22} stroke={1.8} /></span>}
      <h1 className="page-title">{children}</h1>
    </div>
  );
}
