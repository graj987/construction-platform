import React from 'react';
import { STATUS_COLORS } from '../../utils/helpers';

export default function Badge({ status, className = '' }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  return <span className={`badge ${color} ${className}`}>{status}</span>;
}
