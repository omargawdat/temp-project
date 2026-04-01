export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
