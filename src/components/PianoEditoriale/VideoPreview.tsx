import { useState } from "react";
import { Film } from "lucide-react";

// Anteprima video per griglie e miniature: carica solo i metadati e mostra il
// primo frame (il "#t=0.1" evita il riquadro nero su Safari/iOS). Se il file non
// è riproducibile dal browser (es. .mov HEVC su Chrome) mostra un segnaposto
// invece di un riquadro vuoto.
export function VideoPreview({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted text-muted-foreground">
        <Film className="size-6" />
        <span className="px-1 text-center text-[10px] leading-tight">Video non riproducibile</span>
      </div>
    );
  }

  return (
    <video
      src={`${src}#t=0.1`}
      className={className}
      muted
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  );
}
