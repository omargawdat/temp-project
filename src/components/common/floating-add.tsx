export function FloatingAdd({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="rounded-full transition-all">
        {children}
      </div>
    </div>
  );
}
