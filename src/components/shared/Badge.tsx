import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'ai';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {variant === 'ai' && <span style={{ marginRight: '2px' }}>🤖</span>}
      {children}
    </span>
  );
};

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
}

export const Pill: React.FC<PillProps> = ({ count, className = '', ...props }) => {
  return (
    <span
      className={`${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--primary-600)',
        color: '#ffffff',
        fontSize: 'var(--fs-overline)',
        fontWeight: 'bold',
        minWidth: '18px',
        height: '18px',
        borderRadius: '50%',
        padding: '0 5px',
        ...props.style
      }}
      {...props}
    >
      {count}
    </span>
  );
};
