export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 140 50" 
        className="h-full w-auto text-[#1F7B00] dark:text-white transition-colors drop-shadow-sm"
        fill="currentColor"
      >
        {/* Main Leaf */}
        <path d="M 85 24 Q 78 5 98 0 Q 110 5 95 24 Q 90 26 85 24 Z" />
        {/* Smaller Leaf */}
        <path d="M 86 24 Q 78 12 85 6 Q 95 6 92 14 Q 90 20 86 24 Z" />
        
        {/* Text */}
        <text 
          x="5" 
          y="42" 
          fontFamily="Georgia, 'Times New Roman', serif" 
          fontSize="46" 
          fontWeight="bold" 
          letterSpacing="-1.5"
        >
          Eden
        </text>
      </svg>
    </div>
  );
}
