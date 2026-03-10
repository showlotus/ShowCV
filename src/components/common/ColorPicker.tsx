import { cn } from '@/utils'

interface ColorPickerProps {
  label: string
  value: string
  presetColors?: { name: string; value: string }[]
  onChange: (value: string) => void
  className?: string
}

export function ColorPicker({ label, value, presetColors, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      {presetColors && (
        <div className="mt-2 flex flex-wrap gap-2">
          {presetColors.map(color => (
            <button
              key={color.value}
              onClick={() => onChange(color.value)}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                value === color.value ? 'border-gray-800' : 'border-transparent'
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  )
}
