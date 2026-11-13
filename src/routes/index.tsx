import { pageMetadata } from "@/lib/pageMetadata";
import { createFileRoute, Link } from "@tanstack/react-router";
import { trendRealTime, trendAttuali, trendEvergreen, canaliInspo } from "@/lib/trends";
import { ArrowRight, Zap, TrendingUp, Sparkles, CalendarDays, Crown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: pageMetadata("Trendzn × Burger King — Trend social & canali inspo", "Esplora trend social real time, trend attuali e canali di ispirazione, filtrabili per industry, piattaforma e categoria."),
  }),
  component: Index,
});

function Index() {
  const cards = [
    {
      to: "/king-taste",
      label: "KING TASTE",
      icon: Zap,
      blurb: "Inspo di prodotto: i contenuti che mettono al centro il Whopper, la griglia e il momento del morso.",
    },
    {
      to: "/kingdom-news",
      label: "KINGDOM NEWS",
      icon: TrendingUp,
      blurb: "Idee di come vengono comunicati i lanci di prodotto e le promo.",
    },
    {
      to: "/king-life",
      label: "KING LIFE",
      icon: Sparkles,
      blurb: "Contenuti con trend presi dai momenti di consumo.",
    },
    {
      to: "/king-mood",
      label: "KING MOOD",
      icon: Crown,
      blurb: "Trend vari sul sentirsi Troppo King: l'attitudine e il modo di vivere il Troppo King.",
    },
    {
      to: "/competitor",
      label: "Competitor",
      //count: influencer.length,
      icon: Sparkles,
      blurb: "Monitoraggio Brand e Competitor - Real Time",
    },
    {
      to: "/piano-editoriale",
      label: "Piano Editoriale",
      icon: CalendarDays,
      blurb: "Calendario editoriale mensile con copy, visual e approvazioni.",
    },
  ] as const;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-accent/10 p-8 sm:p-14">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 size-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Social trend watcher
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
            TRENDZN x BURGER KING! Tutti i trend social, in un posto solo.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Il radar trend social di Burger King.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-primary"
          >
            <c.icon className="size-7 text-primary" />
            <div className="mt-5 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold">{c.label}</h2>
              <span className="font-display text-2xl font-bold text-muted-foreground group-hover:text-primary">
                {"count" in c ? (c.count as number) : null}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
              Apri <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
