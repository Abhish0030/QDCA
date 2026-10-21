import { motion } from "framer-motion";

export default function AdminSectionCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = "",
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || subtitle || Icon || actions) ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
                <Icon className="h-4 w-4 text-purple-600" />
              </div>
            ) : null}
            <div>
              {title ? <h3 className="text-sm font-semibold text-gray-800">{title}</h3> : null}
              {subtitle ? <p className="mt-1 text-xs leading-5 text-gray-400">{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </motion.section>
  );
}
