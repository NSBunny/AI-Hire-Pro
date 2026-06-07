import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`card ${hoverable ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface StatsCardProps extends CardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
    label?: string;
  };
  progress?: number; // 0 to 100
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  progress,
  className = '',
  ...props
}) => {
  return (
    <Card className={`stats-card card-hover ${className}`} {...props}>
      <div className="flex justify-between items-center w-full">
        <span className="stats-label">
          {icon}
          {title}
        </span>
      </div>
      
      <div className="stats-value">{value}</div>
      
      <div className="flex items-center justify-between w-full mt-2">
        {trend && (
          <span className={`stats-trend ${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
              {trend.label || 'vs last month'}
            </span>
          </span>
        )}
        
        {progress !== undefined && (
          <div style={{ flex: 1, marginLeft: trend ? '16px' : '0' }}>
            <div style={{
              height: '6px',
              backgroundColor: 'var(--gray-200)',
              borderRadius: '3px',
              width: '100%',
              overflow: 'hidden',
              display: 'flex'
            }}>
              <div style={{
                width: `${progress}%`,
                backgroundColor: 'var(--primary-600)',
                borderRadius: '3px',
                transition: 'width 0.5s ease-out'
              }} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
