export default function AdminEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">{description}</p>
      {actionLabel ? (
        <button
          onClick={onAction}
          className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
