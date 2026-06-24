import { useState } from 'react';

const sizes = {
  sm: { h: '1.75rem', px: '0.625rem', font: '0.75rem', icon: 14 },
  md: { h: '2.25rem', px: '1rem', font: '0.875rem', icon: 16 },
};

export default function Tabs(props) {
  const { items = [], value, defaultValue, onChange, size = 'md' } = props;
  const [internal, setInternal] = useState(defaultValue || items[0]?.value);
  const active = value !== undefined ? value : internal;
  const s = sizes[size];
  const handle = (v) => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return (
    <div role="tablist" style={{ display: 'inline-flex', gap: 2, borderBottom: '1px solid var(--vb-s-04)' }}>
      {items.map((it) => {
        const on = it.value === active;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => handle(it.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: s.h,
              padding: `0 ${s.px}`,
              border: 0,
              borderTopLeftRadius: 'var(--radius-input)',
              borderTopRightRadius: 'var(--radius-input)',
              background: on ? 'var(--color-primary)' : 'var(--vb-s-01)',
              color: on ? '#fff' : 'var(--color-text)',
              fontFamily: 'var(--font-family-body)',
              fontWeight: on ? 700 : 400,
              fontSize: s.font,
              cursor: on ? 'default' : 'pointer',
              transition: 'var(--motion-transition-default)',
            }}
          >
            {it.icon && (
              <span className="material-icons-outlined" style={{ fontSize: s.icon, lineHeight: 1 }}>
                {it.icon}
              </span>
            )}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
