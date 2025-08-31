export function AppLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="iNteract-AOE Logo">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-500"
      >
        <path
          d="M19.5 24C23.0899 24 26 21.0899 26 17.5C26 13.9101 23.0899 11 19.5 11"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M14 24C18.4183 24 22 20.4183 22 16C22 11.5817 18.4183 8 14 8"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M8.5 24C13.7467 24 18 19.7467 18 14.5C18 9.25329 13.7467 5 8.5 5"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="5" cy="24" r="4" fill="currentColor" />
      </svg>
      <span className="text-xl font-bold tracking-tight text-foreground">
        <span className="text-blue-500">iN</span>teract
      </span>
    </div>
  );
}
