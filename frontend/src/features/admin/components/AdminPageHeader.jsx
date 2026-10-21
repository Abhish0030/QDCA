import { motion } from "framer-motion";

function ActionButton({ action }) {
  const tone =
    action.variant === "primary"
      ? "bg-purple-600 text-white shadow-md shadow-purple-200 hover:bg-purple-700"
      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50";

  return (
    <button
      onClick={action.onClick}
      className={`inline-flex min-h-[42px] items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${tone}`}
    >
      {action.icon ? <action.icon className="h-4 w-4" /> : null}
      {action.label}
    </button>
  );
}

export default function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions = [],
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{eyebrow}</p>
          ) : null}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          </div>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {actions.map((action) => (
              <ActionButton key={action.label} action={action} />
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </motion.div>
  );
}
