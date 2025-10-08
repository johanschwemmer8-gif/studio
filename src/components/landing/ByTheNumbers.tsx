
const stats = [
    { value: "85%", label: "MVP Complete", description: "Technical readiness validated" },
    { value: "70%", label: "Gross Margin", description: "SaaS-grade unit economics" },
    { value: "R1.53T", label: "Market", description: "South African retail opportunity" },
    { value: "20+", label: "Years", description: "Founder retail expertise" },
  ];
  
  export default function ByTheNumbers() {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
              Proven Technology. Real Results.
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <p className="text-5xl font-bold text-accent">{stat.value}</p>
                <p className="mt-2 text-lg font-semibold">{stat.label}</p>
                <p className="mt-1 text-sm text-foreground/70">{stat.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-muted-foreground">
            iNteract AOE is backed by proven technology, deep industry expertise,
            and a capital-efficient business model.
          </p>
        </div>
      </section>
    );
  }
  