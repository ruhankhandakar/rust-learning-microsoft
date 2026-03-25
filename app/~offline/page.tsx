export default function OfflinePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <span className="text-6xl mb-4">🦀</span>
      <h1 className="text-2xl font-bold mb-2">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-md">
        This page hasn&apos;t been cached yet. Connect to the internet and
        visit it once — after that it&apos;ll be available offline.
      </p>
    </main>
  );
}
