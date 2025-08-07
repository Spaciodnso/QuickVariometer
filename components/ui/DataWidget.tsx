
import React from 'react';

interface DataWidgetProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

const DataWidget: React.FC<DataWidgetProps> = ({
  label,
  value,
  unit,
  className = '',
  valueClassName = '',
  labelClassName = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-lg bg-gray-800/50 ${className}`}>
      <span className={`text-sm text-gray-400 uppercase tracking-wider ${labelClassName}`}>{label}</span>
      <div className="flex items-baseline">
        <span className={`text-3xl font-bold font-mono ${valueClassName}`}>{value}</span>
        {unit && <span className="text-lg ml-1 text-gray-300">{unit}</span>}
      </div>
    </div>
  );
};

export default DataWidget;
