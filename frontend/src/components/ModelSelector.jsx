import { useId } from "react";

const MODEL_OPTIONS = [
  { value: "auto", label: "Auto: Groq → OpenRouter → Llama → Gemma" },
  { value: "llama", label: "Llama 3.2" },
  { value: "gemma", label: "Gemma 4 26B (OpenRouter Free)" },
  { value: "nemotron", label: "Tencent HY3 (OpenRouter)" },
  { value: "groq", label: "Groq GPT OSS 120B" },
];

export default function ModelSelector({ value, onChange, disabled = false }) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
        AI Model
      </label>
      <select
        id={id}
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {MODEL_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
