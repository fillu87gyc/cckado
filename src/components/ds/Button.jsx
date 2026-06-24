import { useState } from 'react';

const sizes = {
  sm: { h: '1.5rem', px: '0.5rem', font: '0.75rem', icon: 16 },
  md: { h: '2.25rem', px: '1rem', font: '0.875rem', icon: 18 },
  lg: { h: '3rem', px: '1rem', font: '1rem', icon: 22 },
};
const minWidths = { sm: '5rem', md: '6rem', lg: '11rem' };

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

export default function Button(props) {
  const {
    appearance = 'secondary',
    size = 'md',
    danger = false,
    widthFull = false,
    hasMinWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    style,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  } = props;
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const s = sizes[size];
  const skin = paint(appearance, danger, hover);
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375em',
    boxSizing: 'border-box',
    padding: `0 ${s.px}`,
    height: s.h,
    minWidth: hasMinWidth ? minWidths[size] : undefined,
    width: widthFull ? '100%' : undefined,
    fontFamily: 'var(--font-family-body)',
    fontSize: s.font,
    fontWeight: 700,
    lineHeight: 1,
    textAlign: 'center',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
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
  };
  return (
    <button
      type="button"
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={(e) => { setHover(true); onMouseEnter && onMouseEnter(e); }}
      onMouseLeave={(e) => { setHover(false); onMouseLeave && onMouseLeave(e); }}
      onFocus={(e) => { setFocus(true); onFocus && onFocus(e); }}
      onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
      {...rest}
    >
      {leftIcon && (
        <span className="material-icons-outlined" style={{ fontSize: s.icon, lineHeight: 1 }}>
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span className="material-icons-outlined" style={{ fontSize: s.icon, lineHeight: 1 }}>
          {rightIcon}
        </span>
      )}
    </button>
  );
}
