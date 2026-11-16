import { useEffect, useRef } from "react";
import type { EditorialPost, ReviewComponent } from "@/lib/editorialPlan";

const RAIL_WIDTH = 56;
// Margine laterale interno: i riquadri ingranditi (scale) non vengono tagliati dal contenitore scrollabile
const RAIL_PAD = 10;
const GAP = 16;
// Altezza della navbar sticky: limite superiore minimo della colonna
const NAVBAR_OFFSET = 72;
// Ingombro totale a sinistra delle schede: RAIL_WIDTH + 2*RAIL_PAD + GAP = 92px. La colonna dei post
// in piano-editoriale.index.tsx riserva lo stesso spazio (sm:ml-[92px]) sotto i 1520px, dove il margine
// della pagina non basta; da 1520px in su il margine laterale è già sufficiente.

const PALETTE = {
  none: { border: "var(--color-border)", bg: "transparent", text: "var(--color-muted-foreground)", solid: "var(--color-primary)" },
  some: { border: "#eab308", bg: "color-mix(in oklch, #eab308 18%, transparent)", text: "#eab308", solid: "#eab308" },
  all: { border: "#22c55e", bg: "color-mix(in oklch, #22c55e 18%, transparent)", text: "#22c55e", solid: "#22c55e" },
  violet: { border: "#8b5cf6", bg: "color-mix(in oklch, #8b5cf6 18%, transparent)", text: "#8b5cf6", solid: "#8b5cf6" },
  published: { border: "#06b6d4", bg: "color-mix(in oklch, #06b6d4 18%, transparent)", text: "#06b6d4", solid: "#06b6d4" },
} as const;

function formatDayMonth(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function approvalLevel(
  approvals: Record<ReviewComponent, boolean> | undefined,
  programmato: boolean,
  publishedCount: number,
): keyof typeof PALETTE {
  if (publishedCount > 0) return "published";
  if (!approvals) return "none";
  const values = [approvals.copy, approvals.copy_visual, approvals.visual];
  if (values.every(Boolean)) return programmato ? "violet" : "all";
  if (values.some(Boolean)) return "some";
  return "none";
}

export function PostNumberRail({
  posts,
  getPostEl,
  anchorRef,
  topAnchorRef,
  approvalsByPost,
  publishedCountByPost,
}: {
  posts: EditorialPost[];
  getPostEl: (id: string) => HTMLElement | null;
  anchorRef: React.RefObject<HTMLElement | null>;
  // Barra dei filtri (mese/anno): la colonna parte sempre sotto di essa e sale fino alla navbar quando esce dalla vista
  topAnchorRef?: React.RefObject<HTMLElement | null>;
  approvalsByPost: Record<string, Record<ReviewComponent, boolean>>;
  publishedCountByPost: Record<string, number>;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let frame = requestAnimationFrame(tick);

    function tick() {
      const anchorEl = anchorRef.current;
      const railEl = railRef.current;
      if (anchorEl && railEl) {
        const left = anchorEl.getBoundingClientRect().left - GAP - RAIL_WIDTH - RAIL_PAD;
        railEl.style.left = `${Math.max(8, left)}px`;
        const filtersEl = topAnchorRef?.current;
        const top = filtersEl ? Math.max(NAVBAR_OFFSET, filtersEl.getBoundingClientRect().bottom + GAP) : NAVBAR_OFFSET;
        railEl.style.top = `${top}px`;
      }

      const viewportCenter = window.innerHeight / 2;
      const spread = window.innerHeight * 0.55;
      let bestIndex = -1;
      let bestT = 0;
      posts.forEach((post, i) => {
        const el = getPostEl(post.id);
        const boxEl = boxRefs.current[i];
        if (!el || !boxEl) return;
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - viewportCenter);
        const t = Math.max(0, 1 - dist / spread);
        const active = t > 0.55;
        if (t > bestT) {
          bestT = t;
          bestIndex = i;
        }
        const palette = PALETTE[approvalLevel(approvalsByPost[post.id], post.programmato, publishedCountByPost[post.id] ?? 0)];
        const scale = 1 + t * 0.55;
        boxEl.style.transform = `scale(${scale})`;
        boxEl.style.borderColor = palette.border;
        boxEl.style.backgroundColor = palette.bg;
        boxEl.style.color = palette.text;
        boxEl.style.boxShadow = "none";
        boxEl.style.zIndex = active ? "10" : "1";
      });

      // Se la colonna è più alta della finestra, scorre per tenere visibile il post al centro
      const railEl2 = railRef.current;
      const bestEl = bestIndex >= 0 ? boxRefs.current[bestIndex] : null;
      if (railEl2 && bestEl && railEl2.scrollHeight > railEl2.clientHeight + 1) {
        // Scorre solo se la data attiva esce dall'area visibile, così a inizio pagina il primo riquadro resta intero
        const pad = 24;
        const top = bestEl.offsetTop;
        const bottom = top + bestEl.offsetHeight;
        let target = railEl2.scrollTop;
        if (top - pad < target) target = top - pad;
        else if (bottom + pad > target + railEl2.clientHeight) target = bottom + pad - railEl2.clientHeight;
        const delta = target - railEl2.scrollTop;
        if (Math.abs(delta) > 1) railEl2.scrollTop += delta * 0.15;
      }
      frame = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(frame);
  }, [posts, getPostEl, anchorRef, topAnchorRef, approvalsByPost, publishedCountByPost]);

  if (posts.length === 0) return null;

  return (
    <div
      ref={railRef}
      // top (aggiornato a ogni frame) = sotto la barra dei filtri o, scrollando, sotto la navbar; bottom = margine dal fondo. Se i post non ci stanno, la colonna scorre.
      className="fixed bottom-4 top-[72px] z-20 hidden overflow-y-auto sm:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ width: RAIL_WIDTH + RAIL_PAD * 2, paddingInline: RAIL_PAD }}
    >
      <div className="my-auto flex w-full flex-col items-center gap-3 py-4">
      {posts.map((post, i) => (
        <button
          key={post.id}
          type="button"
          onClick={() => getPostEl(post.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          ref={(el) => {
            boxRefs.current[i] = el;
          }}
          title={`Vai al post del ${formatDayMonth(post.post_date)}`}
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl border text-[11px] font-bold tabular-nums transition-[background-color,border-color,box-shadow] [transform-style:preserve-3d] will-change-transform"
          style={{ borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }}
        >
          {formatDayMonth(post.post_date)}
        </button>
      ))}
      </div>
    </div>
  );
}
