import { useEffect, useState } from "react";
import { getCoverSignedUrl } from "@/lib/books";

interface Book3DProps {
  coverPath: string | null;
  title: string;
  className?: string;
}

export function Book3D({ coverPath, title, className = "" }: Book3DProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!coverPath) { setUrl(null); return; }
    getCoverSignedUrl(coverPath).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [coverPath]);

  return (
    <div className={`book-scene ${className}`}>
      <div className="book-3d relative w-[200px] h-[290px] mx-auto">
        <div className="book-face book-cover">
          {url ? (
            <img src={url} alt={`Cover of ${title}`} loading="lazy" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
              <span className="font-serif text-lg font-bold text-primary-foreground leading-tight">{title}</span>
              <span className="mt-3 text-xs uppercase tracking-widest text-primary-foreground/70">Stanley Samson</span>
            </div>
          )}
        </div>
        <div className="book-face book-back" />
        <div className="book-face book-spine flex items-center justify-center">
          <span className="rotate-180 [writing-mode:vertical-rl] font-serif text-xs font-semibold text-primary-foreground/90 px-1 truncate max-w-[260px]">
            {title}
          </span>
        </div>
        <div className="book-face book-pages" />
        <div className="book-face book-top" />
        <div className="book-face book-bottom" />
      </div>
    </div>
  );
}
