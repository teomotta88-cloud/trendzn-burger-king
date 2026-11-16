import { useEffect, useState } from "react";
import { VideoPreview } from "./VideoPreview";
import {
  Grid3x3,
  Bookmark,
  UserSquare2,
  Heart,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Link2,
  Coffee,
} from "lucide-react";
import {
  type EditorialPost,
  type EditorialPostMedia,
  type PublishedPostMatch,
  type EditorialClientChannel,
  listMedia,
  getPublishedMatches,
  listClientChannels,
} from "@/lib/editorialPlan";

// Profilo Burger King Italia (copia di @burgerking_it)
const FALLBACK_PROFILE = {
  avatar: "/brand/burger-king-logo.svg",
  handle: "burgerking_it",
  name: "Burger King Italia",
  bio: "Ci hanno buttato in mezzo ai Burger e ne siamo usciti King.\nTROPPO KING.\nScarica l'app 👇",
  linkUrl: "https://3l9c.adj.st/homepage?adj_t=16l1a267",
  posts: "1636",
  followers: "101K",
  following: "12",
  verified: true,
  followedBy: ["jessdipy", "nebbioinvalpadana"],
  followedByMore: 3,
};

function isVideo(url: string, type: string | null | undefined) {
  return (!!type && type.startsWith("video")) || /\.(mp4|mov|webm)$/i.test(url);
}

export function InstagramFeedPreview({ posts }: { posts: EditorialPost[] }) {
  const [mediaByPost, setMediaByPost] = useState<Record<string, EditorialPostMedia[]>>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [matchesByPost, setMatchesByPost] = useState<Record<string, PublishedPostMatch[]>>({});
  const [igChannel, setIgChannel] = useState<EditorialClientChannel | null>(null);

  // Profilo scrapato one-shot alla creazione del canale cliente Instagram
  // (vedi editorialPlan.addClientChannel): qui lo leggiamo così com'è salvato,
  // niente nuove chiamate di scraping da questa pagina.
  useEffect(() => {
    let cancelled = false;
    listClientChannels().then((channels) => {
      if (cancelled) return;
      const ig = channels.find((c) => c.canale === "IG" && c.avatar_url) ?? channels.find((c) => c.canale === "IG");
      setIgChannel(ig ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const PROFILE = igChannel && igChannel.avatar_url && igChannel.followers_count
    ? {
        avatar: igChannel.avatar_url,
        handle: igChannel.handle,
        name: igChannel.display_name || igChannel.handle,
        bio: igChannel.bio || "",
        linkUrl: igChannel.url,
        posts: igChannel.posts_count || "—",
        followers: igChannel.followers_count || "—",
        following: igChannel.following_count || "—",
        verified: false,
        followedBy: [] as string[],
        followedByMore: 0,
      }
    : FALLBACK_PROFILE;

  useEffect(() => {
    let cancelled = false;
    Promise.all(posts.map((p) => listMedia(p.id).then((m) => [p.id, m] as const))).then((entries) => {
      if (!cancelled) setMediaByPost(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [posts]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(posts.map((p) => getPublishedMatches(p.id).then((m) => [p.id, m] as const))).then((entries) => {
      if (!cancelled) setMatchesByPost(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [posts]);

  function mediaFor(post: EditorialPost): { url: string; type: string | null }[] {
    const fromTable = mediaByPost[post.id];
    if (fromTable && fromTable.length > 0) return fromTable.map((m) => ({ url: m.url, type: m.type }));
    if (post.visual_url) return [{ url: post.visual_url, type: post.visual_type }];
    return [];
  }

  const withVisual = [...posts]
    .filter((p) => mediaFor(p).length > 0)
    .sort((a, b) => b.post_date.localeCompare(a.post_date));

  const selectedPost = withVisual.find((p) => p.id === selectedPostId) ?? null;
  const selectedMedia = selectedPost ? mediaFor(selectedPost) : [];
  const selectedIgUrl = selectedPost ? matchesByPost[selectedPost.id]?.find((m) => m.canale === "IG")?.url : null;

  function openPost(postId: string) {
    setSelectedPostId(postId);
    setMediaIndex(0);
  }

  function closeModal() {
    setSelectedPostId(null);
  }

  function navigateMedia(dir: -1 | 1) {
    setMediaIndex((i) => (selectedMedia.length === 0 ? 0 : (i + dir + selectedMedia.length) % selectedMedia.length));
  }

  useEffect(() => {
    if (!selectedPost) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") navigateMedia(-1);
      if (e.key === "ArrowRight") navigateMedia(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPost, selectedMedia.length]);

  const currentMedia = selectedMedia[mediaIndex];

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 sm:p-8">
      <div className="flex items-start gap-6 sm:gap-14">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f5ebdc] sm:size-40">
          <img
            src={PROFILE.avatar}
            alt={PROFILE.handle}
            className={PROFILE.avatar.endsWith(".svg") ? "h-[68%] w-auto object-contain" : "size-full object-cover"}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold sm:text-2xl">{PROFILE.handle}</h2>
              {PROFILE.verified && (
                <svg viewBox="0 0 40 40" className="size-5 shrink-0" aria-label="Account verificato">
                  <path
                    fill="#0095f6"
                    d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                  />
                </svg>
              )}
              <span className="ml-1 text-lg leading-none text-muted-foreground">···</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{PROFILE.name}</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><strong>{PROFILE.posts}</strong> post</span>
            <span><strong>{PROFILE.followers}</strong> follower</span>
            <span><strong>{PROFILE.following}</strong> seguiti</span>
          </div>

          <div className="space-y-2 pt-1 text-sm">
            <p className="whitespace-pre-line">{PROFILE.bio}</p>
            {PROFILE.linkUrl && (
              <a
                href={PROFILE.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 break-all font-semibold text-primary underline"
              >
                <Link2 className="size-4 shrink-0 -rotate-45" />
                {PROFILE.linkUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      {PROFILE.followedBy.length > 0 && (
        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex -space-x-2">
            <span className="size-9 rounded-full border-2 border-card bg-gradient-to-br from-[#6b7a52] to-[#2f3a2a]" />
            <span className="size-9 rounded-full border-2 border-card bg-secondary" />
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-card bg-[#ff5a52] text-white">
              <Coffee className="size-4" />
            </span>
          </div>
          <span>
            Account seguito da <strong className="text-foreground">{PROFILE.followedBy.join(", ")}</strong>
            {PROFILE.followedByMore > 0 && ` + altri ${PROFILE.followedByMore}`}
          </span>
        </div>
      )}

      <div className="mt-6 flex justify-center gap-10 border-t border-border pt-2 text-muted-foreground">
        <Grid3x3 className="size-5 text-foreground" />
        <UserSquare2 className="size-5" />
        <Bookmark className="size-5" />
      </div>

      <div className="mt-1 grid grid-cols-3 gap-0.5">
        {withVisual.length === 0 && (
          <p className="col-span-3 py-10 text-center text-sm text-muted-foreground">
            Nessun visual ancora caricato nel piano.
          </p>
        )}
        {withVisual.map((p) => {
          const media = mediaFor(p);
          const first = media[0];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => openPost(p.id)}
              className="relative aspect-square overflow-hidden bg-muted"
            >
              {first && isVideo(first.url, first.type) ? (
                <VideoPreview src={first.url} className="size-full object-cover" />
              ) : first ? (
                <img src={first.url} alt={p.topic ?? ""} className="size-full object-cover" />
              ) : null}
              {media.length > 1 && (
                <span className="absolute right-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {media.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={closeModal}>
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            title="Chiudi"
          >
            <X className="size-5" />
          </button>

          <div
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-card sm:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex aspect-square shrink-0 items-center justify-center bg-black sm:aspect-auto sm:w-[62%]">
              {currentMedia && isVideo(currentMedia.url, currentMedia.type) ? (
                <video src={currentMedia.url} controls autoPlay playsInline className="max-h-full max-w-full object-contain" />
              ) : currentMedia ? (
                <img src={currentMedia.url} alt="" className="max-h-full max-w-full object-contain" />
              ) : null}

              {selectedMedia.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateMedia(-1);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
                    title="Precedente"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateMedia(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
                    title="Successivo"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white">
                    {mediaIndex + 1} / {selectedMedia.length}
                  </span>
                </>
              )}
            </div>

            <div className="flex min-h-0 w-full min-w-0 flex-col sm:w-[38%]">
              <div className="flex shrink-0 items-center gap-2 border-b border-border p-3">
                <img src={PROFILE.avatar} alt={PROFILE.handle} className="size-8 shrink-0 rounded-full object-cover" />
                <span className="text-sm font-semibold">{PROFILE.handle}</span>
              </div>
              <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto p-3 text-sm">
                <p className="whitespace-pre-line break-words">
                  <span className="font-semibold">{PROFILE.handle}</span> {selectedPost.channel_copies?.IG || ""}
                </p>
              </div>
              <div className="shrink-0 border-t border-border p-3">
                <div className="flex items-center gap-3 text-foreground">
                  <Heart className="size-5" />
                  <MessageCircle className="size-5" />
                  <Send className="size-5" />
                  <Bookmark className="ml-auto size-5" />
                </div>
                {selectedIgUrl && (
                  <a
                    href={selectedIgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
                  >
                    <ExternalLink className="size-4" />
                    Guarda su Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
