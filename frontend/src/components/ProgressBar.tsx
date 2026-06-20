interface Props {
  value: number; // 0–100
  color?: string;
  height?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ value, color = 'bg-green-500', height = 'h-2', showLabel = false }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-500 w-9 text-right">{pct}%</span>}
    </div>
  );
}
