import { cn } from '../../utils';

interface ColorPickerProps {
  label: string;
  value: string;
  presetColors?: { name: string; value: string }[];
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({
  label,
  value,
  presetColors,
  onChange,
  className,
}: ColorPickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {presetColors && (
        <div className="flex flex-wrap gap-2 mt-2">
          {presetColors.map((color) => (
            <button
              key={color.value}
              onClick={() => onChange(color.value)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                value === color.value ? 'border-gray-800' : 'border-transparent'
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
