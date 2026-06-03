export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
      <div className="relative w-16 h-16">
        {/* Glow Aura */}
        <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-xl animate-pulse"></div>
        
        {/* Modern Double Spinner */}
        <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/10 dark:border-white/5"></div>
        <div className="absolute inset-0 rounded-full border-[3px] border-t-emerald-500 border-r-emerald-500/40 border-b-emerald-500/10 border-l-emerald-500/70 animate-spin duration-1000"></div>
        
        {/* Golden Leaf Accent Spinner */}
        <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-amber-500 animate-spin duration-700 reverse-spin"></div>
      </div>

      <div className="space-y-1.5 text-center">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest animate-pulse">
          Eden Portal
        </h3>
        <p className="text-xs font-light text-gray-400 dark:text-gray-500 tracking-wider">
          Cultivating your workspace...
        </p>
      </div>
    </div>
  );
}
