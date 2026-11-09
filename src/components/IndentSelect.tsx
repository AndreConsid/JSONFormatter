import type { Indent } from '../utils/formatJson.ts'

const INDENT_OPTIONS = [
  { label: '2 spaces', value: '2' },
  { label: '4 spaces', value: '4' },
  { label: 'Tab', value: 'tab' },
]

function toIndent(optionValue: string): Indent {
  return optionValue === 'tab' ? '\t' : Number(optionValue)
}

function toOptionValue(indent: Indent): string {
  return indent === '\t' ? 'tab' : String(indent)
}

interface IndentSelectProps {
  value: Indent
  onChange: (indent: Indent) => void
}

function IndentSelect({ value, onChange }: IndentSelectProps) {
  return (
    <label className="indent-select">
      Indentation
      <select
        className="select"
        value={toOptionValue(value)}
        onChange={(event) => onChange(toIndent(event.target.value))}
      >
        {INDENT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default IndentSelect
