export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center gap-3 text-white/80">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
