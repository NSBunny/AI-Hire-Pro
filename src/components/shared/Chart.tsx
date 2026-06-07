import React from 'react';

// ==========================================
// AREA / LINE TREND CHART
// ==========================================
interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({ data, height = 200 }) => {
  const padding = 40;
  const width = 500;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const minVal = 0;

  // Calculate points
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.label, val: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="chart-container flex-col justify-center items-center">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + chartHeight * ratio;
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border-color)" strokeDasharray="3 3" />
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
                {val}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#area-gradient)" />}

        {/* Stroke line */}
        {linePath && <path d={linePath} fill="none" stroke="var(--primary-600)" strokeWidth="3" strokeLinecap="round" />}

        {/* Data points & labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke="var(--primary-600)" strokeWidth="2.5" />
            <text x={p.x} y={height - padding + 18} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ==========================================
// VERTICAL BAR COMPARISON CHART
// ==========================================
interface BarChartProps {
  data: { label: string; value: number; valueAlt?: number }[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 200 }) => {
  const padding = 40;
  const width = 500;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const values = data.flatMap(d => [d.value, d.valueAlt || 0]);
  const maxVal = Math.max(...values, 10);

  const barWidth = Math.min(25, (chartWidth / data.length) * 0.4);
  const groupWidth = chartWidth / data.length;

  return (
    <div className="chart-container flex-col justify-center items-center">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {/* Y Axis Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + chartHeight * ratio;
          const val = Math.round(maxVal - ratio * maxVal);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border-color)" strokeDasharray="3 3" />
              <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, index) => {
          const groupX = padding + index * groupWidth + (groupWidth - barWidth * (d.valueAlt !== undefined ? 2.2 : 1)) / 2;
          const height1 = (d.value / maxVal) * chartHeight;
          const y1 = padding + chartHeight - height1;

          let height2 = 0;
          let y2 = 0;
          if (d.valueAlt !== undefined) {
            height2 = (d.valueAlt / maxVal) * chartHeight;
            y2 = padding + chartHeight - height2;
          }

          return (
            <g key={index}>
              {/* Primary Bar */}
              <rect
                x={groupX}
                y={y1}
                width={barWidth}
                height={Math.max(height1, 2)}
                rx="4"
                className="svg-chart-bar"
              />
              
              {/* Alt Bar (If grouped bar chart) */}
              {d.valueAlt !== undefined && (
                <rect
                  x={groupX + barWidth + 4}
                  y={y2}
                  width={barWidth}
                  height={Math.max(height2, 2)}
                  rx="4"
                  className="svg-chart-bar-alt"
                  fill="var(--secondary-500)"
                />
              )}

              {/* X Axis Label */}
              <text
                x={padding + index * groupWidth + groupWidth / 2}
                y={height - padding + 18}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-secondary)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {data[0]?.valueAlt !== undefined && (
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--primary-600)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Selected / Hired</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'var(--secondary-500)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Applied</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// RADAR RADIAL EVALUATION CHART
// ==========================================
interface RadarChartProps {
  scores: {
    technical: number;
    communication: number;
    cultural: number;
    experience: number;
    problemSolving: number;
  };
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores, size = 300 }) => {
  const center = size / 2;
  const maxRadius = (size / 2) * 0.75;

  const categories = [
    { key: 'technical', label: 'Technical Ability' },
    { key: 'communication', label: 'Communication' },
    { key: 'cultural', label: 'Culture Match' },
    { key: 'experience', label: 'Experience Alignment' },
    { key: 'problemSolving', label: 'Problem Solving' }
  ];

  // Calculate X & Y coordinates for 5 categories (pentagon)
  // Angle for each point is (i * 2 * PI / 5) - PI / 2 (starts from top)
  const getCoordinates = (index: number, value: number) => {
    const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  };

  // Concentric background rings (100%, 75%, 50%, 25%)
  const gridRings = [100, 75, 50, 25];

  const ringPaths = gridRings.map(level => {
    return categories
      .map((_, i) => {
        const { x, y } = getCoordinates(i, level);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ') + ' Z';
  });

  // Candidate score polygon path
  const scorePoints = categories.map((cat, i) => {
    const scoreVal = scores[cat.key as keyof typeof scores] || 50;
    return getCoordinates(i, scoreVal);
  });
  const scorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="chart-container flex justify-center items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background grids */}
        {ringPaths.map((path, idx) => (
          <path
            key={idx}
            d={path}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray={idx === 0 ? 'none' : '3 3'}
          />
        ))}

        {/* Radial axes lines */}
        {categories.map((_, i) => {
          const outerPoint = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke="var(--border-color)"
              strokeWidth="1"
            />
          );
        })}

        {/* Score polygon fill */}
        <path
          d={scorePath}
          fill="rgba(124, 92, 246, 0.25)"
          stroke="var(--secondary-500)"
          strokeWidth="2.5"
        />

        {/* Axis dots and text labels */}
        {categories.map((cat, i) => {
          const labelPoint = getCoordinates(i, 118);
          const scoreVal = scores[cat.key as keyof typeof scores] || 0;
          const dotPoint = getCoordinates(i, scoreVal);

          // Fine-tune label text alignments
          let textAnchor: 'middle' | 'end' | 'start' = 'middle';
          if (labelPoint.x < center - 10) textAnchor = 'end';
          if (labelPoint.x > center + 10) textAnchor = 'start';

          return (
            <g key={i}>
              {/* Highlight value circle */}
              <circle cx={dotPoint.x} cy={dotPoint.y} r="4" fill="var(--secondary-600)" />
              {/* Axis Label */}
              <text
                x={labelPoint.x}
                y={labelPoint.y + 3}
                textAnchor={textAnchor}
                fontSize="10"
                fontWeight="600"
                fill="var(--text-primary)"
              >
                {cat.label} ({scoreVal}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
