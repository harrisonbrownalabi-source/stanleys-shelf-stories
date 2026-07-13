import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import stanleyPhoto from "@/assets/stanley.webp.asset.json";
import { useBooks, type Book } from "@/lib/books";
import { Book3D } from "@/components/Book3D";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Sparkles, LogOut, Settings, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: books, isLoading } = useBooks();
  const { user, isAdmin } = useAuth();

  const sorted = useMemo(() => books ?? [], [books]);

  return (
    <div className="min-h-screen">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BookOpen className="h-5 w-5 text-accent transition-transform group-hover:rotate-6" />
            <span className="font-serif text-lg font-semibold tracking-tight">Stanley Samson Library</span>
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#about" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition px-3">About</a>
            <a href="#shelf" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition px-3">The Shelf</a>
            {isAdmin && (
              <Button asChild size="sm" variant="secondary">
                <Link to="/admin"><Settings className="h-4 w-4 mr-1.5" /> Admin</Link>
              </Button>
            )}
            {user ? (
              <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild size="sm" variant="ghost">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-float" />
          <div className="absolute bottom-0 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float [animation-delay:2s]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-12 items-center">
          <div className="animate-fade-up">
            <div className="relative mx-auto md:mx-0 w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary blur-2xl opacity-40" />
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-background shadow-[var(--shadow-elegant)] ring-4 ring-accent/30">
                <img src={stanleyPhoto.url} alt="Stanley Samson Ifeoluwa" className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full px-4 py-1.5 shadow-lg border border-accent/40 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium">Author</span>
              </div>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:150ms]">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-3">Meet the Author</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
              <span className="text-shimmer">Stanley Samson</span>
              <br />
              <span className="text-foreground">Ifeoluwa</span>
            </h1>
            <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              <p>
                Stanley Samson Ifeoluwa is an author, cybersecurity practitioner, business analyst, and real estate professional committed to helping people <em className="text-foreground not-italic font-medium">think better, build smarter, and lead with purpose</em>. He believes that every meaningful transformation begins with the right mindset—and that disciplined execution is what turns ideas into lasting impact.
              </p>
              <p>
                Drawing from real-world experience across technology, business, and leadership, Stanley writes books that simplify complex concepts, inspire action, and equip readers with practical strategies for personal and professional growth. His work reflects the same principles that guide his practice through the WAN Group of Companies and independent advisory: clarity, excellence, integrity, and results.
              </p>
              <p>
                Every book on this shelf is written to inform, challenge, and empower—giving readers the knowledge and confidence to create meaningful change in their lives, careers, and organizations.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <a href="#shelf"><BookOpen className="h-4 w-4 mr-2" /> Browse the Shelf</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SHELF */}
      <section id="shelf" className="relative py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 animate-fade-up">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-3">The Collection</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-3">Stanley Samson Library</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A curated shelf of works to inform, challenge, and empower.
            </p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {[0,1,2].map((i) => (
                <div key={i} className="h-[290px] bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyShelf isAdmin={isAdmin} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {sorted.map((book, i) => (
                <BookCard key={book.id} book={book} delay={i * 100} />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Stanley Samson Ifeoluwa. All rights reserved.</p>
          <p className="font-serif italic">Think better. Build smarter. Lead with purpose.</p>
        </div>
      </footer>
    </div>
  );
}

function EmptyShelf({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-card/40 animate-fade-in">
      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
      <h3 className="font-serif text-xl mb-2">The shelf is being prepared</h3>
      <p className="text-muted-foreground">New titles will appear here soon.</p>
      {isAdmin && (
        <Button asChild className="mt-6">
          <Link to="/admin">Add the first book</Link>
        </Button>
      )}
    </div>
  );
}

function BookCard({ book, delay }: { book: Book; delay: number }) {
  return (
    <article className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <Book3D coverPath={book.cover_url} title={book.title} />
      <div className="mt-8 text-center">
        <h3 className="font-serif text-2xl font-semibold mb-2">{book.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-4">{book.description}</p>
        {book.purchase_links.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {book.purchase_links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent/20 hover:border-accent"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
