import { cn } from "@/lib/utils";

export default function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="iNteract Logo">
      <svg
        width="118"
        height="36"
        viewBox="0 0 118 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-auto"
      >
        {/* Icon */}
        <path
          d="M17.8594 13.2398C19.9245 11.1747 22.9902 10.0156 26.1953 10.0156C29.4004 10.0156 32.4661 11.1747 34.5312 13.2398"
          stroke="#2596D7"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M11.5312 6.91357C14.9922 3.45261 19.9805 1.5 25.1953 1.5C30.4101 1.5 35.3984 3.45261 38.8594 6.91357"
          stroke="#2596D7"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="26" cy="21" r="5" fill="#2596D7" />
        
        {/* Text */}
        <text
          x="42"
          y="28"
          fontFamily="Inter, sans-serif"
          fontSize="24"
          fontWeight="bold"
          fill="#2D3748"
        >
          <tspan fill="#2596D7">i</tspan>
          <tspan>N</tspan>
          <tspan>teract</tspan>
        </text>
      </svg>
    </div>
  );
}