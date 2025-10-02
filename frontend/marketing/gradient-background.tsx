export default function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-transparent">
      {/* Animated gradient orbs with dynamic movement - BABY BLUE ONLY */}
      <div className="absolute inset-0">
        {/* Primary orb - Baby Blue - Moving in circles */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px]">
          <div className="w-full h-full bg-[hsl(210,100%,85%)] rounded-full blur-[80px] animate-blob opacity-60" />
        </div>

        {/* Secondary orb - Baby Blue - Reverse movement */}
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px]">
          <div className="w-full h-full bg-[hsl(210,100%,85%)] rounded-full blur-[80px] animate-blob-reverse delay-2000 opacity-50" />
        </div>

        {/* Tertiary orb - Light Baby Blue - Drifting */}
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px]">
          <div className="w-full h-full bg-[hsl(210,100%,85%)] rounded-full blur-[100px] animate-drift opacity-45" />
        </div>

        {/* Floating orb - Baby Blue */}
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -ml-[200px] -mt-[200px]">
          <div className="w-full h-full bg-[hsl(210,100%,85%)] rounded-full blur-[60px] animate-float opacity-40" />
        </div>

        {/* Orbiting orb - Light Baby Blue */}
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -ml-[150px] -mt-[150px]">
          <div className="w-full h-full bg-[hsl(210,100%,85%)] rounded-full blur-[80px] animate-orbit opacity-35" />
        </div>

        {/* Small fast-moving orb - Baby Blue */}
        <div className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px]">
          <div className="w-full h-full bg-[hsl(210,100%,85%)] rounded-full blur-[60px] animate-blob delay-2000 opacity-50" />
        </div>

        {/* Baby Blue mesh gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[hsl(210,100%,85%)]/15 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[hsl(210,100%,85%)]/10 via-transparent to-transparent" />
      </div>

      {/* Very light overlay to maintain some readability */}


      {/* Noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
