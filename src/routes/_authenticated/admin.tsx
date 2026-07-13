import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useBooks, useInvalidateBooks, type Book, type PurchaseLink } from "@/lib/books";
import { Book3D } from "@/components/Book3D";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Upload, X, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const { data: books } = useBooks();
  const invalidate = useInvalidateBooks();
  const [editing, setEditing] = useState<Book | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-3" />
          <h1 className="font-serif text-2xl mb-2">Author access only</h1>
          <p className="text-muted-foreground mb-6">This area is reserved for Stanley. Visitors can freely browse the library.</p>
          <Button asChild><Link to="/">Back to library</Link></Button>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("books").delete().eq("id", deleteTarget.id);
    if (error) return toast.error(error.message);
    if (deleteTarget.cover_url && !deleteTarget.cover_url.startsWith("http")) {
      await supabase.storage.from("book-covers").remove([deleteTarget.cover_url]);
    }
    toast.success("Book removed from shelf");
    setDeleteTarget(null);
    invalidate();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to library
          </Link>
          <span className="font-serif text-lg font-semibold">Admin</span>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4 mr-1.5" /> Create new book profile
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-serif text-4xl font-bold mb-2">Manage the Shelf</h1>
        <p className="text-muted-foreground mb-10">Add, edit, or remove books. Changes appear instantly for visitors.</p>

        {books && books.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground mb-4">The shelf is empty.</p>
            <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4 mr-1.5" /> Add your first book</Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {books?.map((book) => (
              <Card key={book.id} className="p-6 hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <Book3D coverPath={book.cover_url} title={book.title} />
                <div className="mt-8">
                  <h3 className="font-serif text-lg font-semibold truncate">{book.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{book.description}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => setEditing(book)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(book)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {editing && (
        <BookEditor
          book={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this book?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed from the shelf. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookEditor({ book, onClose, onSaved }: { book: Book | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [coverPath, setCoverPath] = useState<string | null>(book?.cover_url ?? null);
  const [links, setLinks] = useState<PurchaseLink[]>(book?.purchase_links ?? [{ label: "Amazon", url: "" }]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!coverPath) { setPreview(null); return; }
    if (coverPath.startsWith("http")) { setPreview(coverPath); return; }
    supabase.storage.from("book-covers").createSignedUrl(coverPath, 3600).then(({ data }) => {
      setPreview(data?.signedUrl ?? null);
    });
  }, [coverPath]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("book-covers").upload(path, file, { upsert: false });
      if (error) throw error;
      setCoverPath(path);
      toast.success("Cover uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) return toast.error("Title and description are required");
    setSaving(true);
    try {
      const cleanLinks = links.filter((l) => l.label.trim() && l.url.trim());
      const payload = { title: title.trim(), description: description.trim(), cover_url: coverPath, purchase_links: cleanLinks };
      const { error } = book
        ? await supabase.from("books").update(payload).eq("id", book.id)
        : await supabase.from("books").insert(payload);
      if (error) throw error;
      toast.success(book ? "Book updated" : "Book added to shelf");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
    void navigate;
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{book ? "Edit book" : "Create new book profile"}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[240px_1fr] gap-6 py-4">
          {/* Live 3D preview */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">Live preview</Label>
            <div className="py-4">
              <Book3D coverPath={coverPath} title={title || "Book title"} />
            </div>
            <div className="mt-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                />
                <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-accent transition">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mx-auto animate-spin" />
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" /> {preview ? "Replace cover" : "Upload cover"}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Book title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="desc">Brief write-up</Label>
              <Textarea id="desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" placeholder="What is this book about?" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Purchase links</Label>
                <Button size="sm" variant="ghost" onClick={() => setLinks([...links, { label: "", url: "" }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add link
                </Button>
              </div>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Store (e.g. Amazon)"
                      value={link.label}
                      onChange={(e) => setLinks(links.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                      className="w-40"
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => setLinks(links.map((l, j) => j === i ? { ...l, url: e.target.value } : l))}
                      className="flex-1"
                    />
                    <Button size="icon" variant="ghost" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {book ? "Save changes" : "Add to shelf"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
