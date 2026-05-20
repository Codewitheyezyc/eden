export function AnimatedPattern() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 opacity-[0.12] dark:opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          animation: 'slide 40s linear infinite',
        }}
      />
      {/* Radial gradient to fade out the pattern at the edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#030303] dark:via-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,white_120%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,#030303_120%)]" />
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide {
          0% {
            transform: translateY(0) translateX(0);
          }
          100% {
            transform: translateY(-60px) translateX(-60px);
          }
        }
      `}} />
    </div>
  );
}
