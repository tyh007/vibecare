import { ExternalLink, Settings2 } from "lucide-react";

const ConfigurationRequired = () => (
  <main className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 px-6 py-16">
    <section className="mx-auto flex min-h-[70vh] max-w-2xl items-center">
      <div className="w-full rounded-3xl border border-border/70 bg-card/90 p-8 shadow-xl backdrop-blur md:p-12">
        <div className="mb-6 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
          <Settings2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Local setup required
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Connect Supabase to run VibeCare
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          This portfolio repository intentionally excludes credentials and does
          not simulate personal wellbeing data. Add the two public Supabase
          client values below, then restart the development server.
        </p>
        <pre className="mt-7 overflow-x-auto rounded-2xl bg-foreground p-5 text-sm text-background">
          <code>{`cp .env.example .env
# Set VITE_SUPABASE_URL
# Set VITE_SUPABASE_PUBLISHABLE_KEY
pnpm dev`}</code>
        </pre>
        <div className="mt-7 flex flex-wrap gap-3 text-sm">
          <a
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            href="https://supabase.com/docs/guides/getting-started"
            target="_blank"
            rel="noreferrer"
          >
            Supabase setup guide
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-semibold text-foreground hover:bg-muted"
            href="https://github.com/tyh007/vibecare#local-setup"
            target="_blank"
            rel="noreferrer"
          >
            Read project setup
          </a>
        </div>
      </div>
    </section>
  </main>
);

export default ConfigurationRequired;
