import { useState } from 'react';

const dims = {
  sm: { box: '1.5rem', icon: 16 },
  md: { box: '2.25rem', icon: 22 },
  lg: { box: '3rem', icon: 28 },
};

function paint(appearance, danger, hover) {
  if (appearance === 'primary') {
    if (danger) {
      return hover
        ? { color: '#fff', background: 'var(--vb-re-07)', border: '0' }
        : { color: '#fff', background: 'var(--color-alert)', border: '0' };
    }
    return hover
      ? { color: '#fff', background: 'var(--color-primary-hover)', border: '0' }
      : { color: '#fff', background: 'var(--color-primary)', border: '0' };
  }
  if (appearance === 'tertiary') {
    if (danger) {
      return hover
        ? { color: 'var(--vb-re-07)', background: 'rgba(250,210,215,0.3)', border: '1px solid transparent' }
        : { color: 'var(--color-alert)', background: 'transparent', border: '1px solid transparent' };
    }
    return hover
      ? { color: 'var(--vb-p-08)', background: 'rgba(220,232,255,0.3)', border: '1px solid transparent' }
      : { color: 'var(--color-text)', background: 'transparent', border: '1px solid transparent' };
  }
  // secondary
  if (danger) {
    return hover
      ? { color: 'var(--vb-re-07)', background: 'var(--vb-re-02)', border: '1px solid var(--vb-re-07)' }
      : { color: 'var(--color-alert)', background: '#fff', border: '1px solid var(--vb-gy-02)' };
  }
  return hover
    ? { color: 'var(--vb-p-08)', background: 'var(--vb-p-02)', border: '1px solid var(--vb-p-08)' }
    : { color: 'var(--color-text)', background: '#fff', border: '1px solid var(--vb-gy-02)' };
}

export default function IconButton(props) {
  const {
    icon,
    appearance = 'secondary',
    size = 'md',
    danger = false,
    disabled,
    style,
    ...rest
  } = props;
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const d = dims[size];
  const skin = paint(appearance, danger, hover);
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: d.box,
        height: d.box,
        padding: 0,
        boxSizing: 'border-box',
        borderRadius: 'var(--radius-input)',
        border: skin.border,
        background: skin.background,
        color: skin.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'var(--motion-transition-default)',
        boxShadow: focus ? 'var(--shadow-focus-ring)' : 'none',
        outline: 'none',
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      {...rest}
    >
      <span className="material-icons-outlined" style={{ fontSize: d.icon, lineHeight: 1 }}>
        {icon}
      </span>
    </button>
  );
}
