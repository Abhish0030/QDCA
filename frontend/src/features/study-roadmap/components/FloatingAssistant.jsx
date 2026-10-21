import { useState } from "react";
import { Bot, Lightbulb, MessageCircle, Sparkles, WandSparkles, X } from "lucide-react";

const ACTIONS = [
  { label: "Study tip", icon: Lightbulb },
  { label: "Explain recommendation", icon: MessageCircle },
  { label: "Generate today's plan", icon: WandSparkles },
];

export default function FloatingAssistant({ currentTopic }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(`Focus on ${currentTopic} for one distraction-free 25-minute session.`);

  function runAction(label) {
    const responses = {
      "Study tip": `Use active recall: explain ${currentTopic} without notes, then solve one example.`,
      "Explain recommendation": `${currentTopic} is recommended because it is the next incomplete milestone in your dependency path.`,
      "Generate today's plan": `Warm up for 5 minutes, practice ${currentTopic} for 25 minutes, then review mistakes for 5 minutes.`,
    };
    setMessage(responses[label]);
  }

  return (
    <div className="fixed bottom-24 right-5 z-30 sm:right-7">
      {open && (
        <div className="mb-3 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-purple-100 bg-white p-4 shadow-2xl shadow-purple-900/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-gray-800"><Bot className="h-4 w-4 text-purple-600" /> AI Study Coach</div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close study coach" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-3 rounded-xl bg-purple-50 p-3 text-xs leading-5 text-purple-800">{message}</p>
          <div className="mt-3 space-y-1.5">
            {ACTIONS.map(action => (
              <button key={action.label} type="button" onClick={() => runAction(action.label)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50">
                <action.icon className="h-3.5 w-3.5 text-purple-500" /> {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="ml-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-xl shadow-purple-300 transition hover:scale-105">
        <Sparkles className="h-5 w-5" />
      </button>
    </div>
  );
}
