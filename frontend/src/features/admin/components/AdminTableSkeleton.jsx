export default function AdminTableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="grid animate-pulse border-b border-gray-100 bg-gray-50/60 px-5 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="h-3 w-20 rounded bg-gray-100" />
        ))}
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid animate-pulse items-center gap-4 px-5 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }, (_, columnIndex) => (
              <div key={columnIndex} className="h-3 rounded bg-gray-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
