export function ErrorState({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-semibold text-alert">Une erreur est survenue</p>
      <p className="mt-1 text-sm text-ink-2">{message}</p>
    </div>
  );
}
