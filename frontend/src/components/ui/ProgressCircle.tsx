import React from 'react';

export default function ProgressCircle({ value = 0, size = 96 }: { value?: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="block">
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={radius} cx={0} cy={0} strokeWidth={stroke} stroke="#eef2ff" fill="none" />
        <circle r={radius} cx={0} cy={0} strokeWidth={stroke} stroke="#1e40af" fill="none" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90)" />
        <text x={0} y={4} textAnchor="middle" className="font-semibold text-lg text-slate-700">{Math.round(value)}%</text>
      </g>
    </svg>
  );
}
