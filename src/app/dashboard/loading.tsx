export default function DashboardLoading() {
  return (
    <div className="px-6 py-10 sm:py-14 max-w-5xl" aria-busy="true" aria-label="Loading your pages">
      <div className="h-9 w-44 bg-surface animate-pulse mb-10" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border border-rule">
            <div className="aspect-[4/3] bg-surface animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-2/3 bg-surface animate-pulse" />
              <div className="h-3 w-1/2 bg-surface animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
