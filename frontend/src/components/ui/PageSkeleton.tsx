/** Loading placeholder for pages whose content depends on the URL. */
export function PageSkeleton() {
  return (
    <div className="container-site animate-pulse py-12" aria-busy aria-label="Loading">
      <div className="mx-auto h-10 w-1/4 rounded-card bg-line/60" />
      <div className="mx-auto mt-4 h-6 w-2/3 rounded-card bg-line/40" />
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-10 w-4/5 rounded-card bg-line/60" />
          <div className="h-24 rounded-card bg-line/40" />
        </div>
        <div className="aspect-[6/5] rounded-feature bg-line/50" />
      </div>
    </div>
  );
}
