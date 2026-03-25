"use client";

import { useEffect, useState } from "react";
import { editorStateFromSerializedDocument } from "@lexical/file";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CLEAR_HISTORY_COMMAND } from "lexical";
import { SendIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { docFromHash } from "../../utils/doc-serialization";
import type { Category, Tag, Group } from "@/payload-types";
import { createQuestion } from "@/actions/questions.actions";

// ── Payload'dan kategori ve tag'leri çek ──────────────────
async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories?limit=100", {
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs ?? [];
}

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/tags?limit=100", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs ?? [];
}

async function fetchGroups(): Promise<Group[]> {
  const res = await fetch("/api/groups?limit=100", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.docs ?? [];
}

export function ShareContentPlugin() {
  const [editor] = useLexicalComposerContext();

  // ── Dialog state ──
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Form state ──
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [groupId, setGroupId] = useState(""); // opsiyonel
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // opsiyonel
  const [visibility, setVisibility] = useState<"public" | "editors_only">(
    "public",
  );

  // ── Veri state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Dialog açılınca kategorileri ve tag'leri yükle
  useEffect(() => {
    if (!open) return;
    setDataLoading(true);
    Promise.all([fetchCategories(), fetchTags(), fetchGroups()])
      .then(([cats, tgs, grps]) => {
        setCategories(cats);
        setTags(tgs);
        setGroups(grps);
      })
      .finally(() => setDataLoading(false));
  }, [open]);

  // Share butonuna basınca içerik kontrolü yap, dialog aç
  function handleShareClick() {
    const editorState = editor.getEditorState();
    const json = editorState.toJSON();
    const isEmpty =
      json.root.children.length === 0 ||
      (json.root.children.length === 1 &&
        (json.root.children[0] as any)?.children?.length === 0);

    if (isEmpty) {
      toast.error("Önce bir içerik yazın.");
      return;
    }

    setOpen(true);
  }

  // Tag seç/kaldır (max 5)
  function toggleTag(tagId: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((t) => t !== tagId);
      }
      if (prev.length >= 5) {
        toast.warning("En fazla 5 etiket seçilebilir.");
        return prev;
      }
      return [...prev, tagId];
    });
  }

  // Formu sıfırla
  function resetForm() {
    setTitle("");
    setCategoryId("");
    setGroupId("");
    setSelectedTags([]);
    setVisibility("public");
  }

  // Soruyu Payload'a gönder
  async function submitQuestion() {
    if (!title.trim()) {
      toast.error("Lütfen bir başlık girin.");
      return;
    }

    setLoading(true);

    try {
      const editorState = editor.getEditorState().toJSON();

      // Lexical içeriği Payload formatına dönüştür
      const children = editorState.root.children.map((node: any) => {
        if (node.type === "tweet") {
          return {
            type: "block",
            version: 1,
            format: "",
            fields: { blockType: "tweet", tweetId: node.id },
          };
        }
        return node;
      });

      const payloadContent = {
        root: { ...editorState.root, children },
      };

      // Fetch yerine server action kullan — auth sorunu olmaz
      const result = await createQuestion({
        title: title.trim(),
        content: payloadContent,
        visibility,
        ...(categoryId && { categoryId: Number(categoryId) }),
        ...(selectedTags.length > 0 && { tagIds: selectedTags.map(Number) }),
      });

      console.log("result:", result);

      if (!result.success) {
        throw new Error(result.error ?? "Bir hata oluştu.");
      }

      toast.success("Sorunuz başarıyla gönderildi!");
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message ?? "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // Hash'ten editör içeriğini yükle
  useEffect(() => {
    docFromHash(window.location.hash).then((doc) => {
      if (doc && doc.source === "editor") {
        editor.setEditorState(editorStateFromSerializedDocument(editor, doc));
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      }
    });
  }, [editor]);

  return (
    <>
      {/* ── Share butonu ── */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={handleShareClick}>
            <SendIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Soruyu Gönder</TooltipContent>
      </Tooltip>

      {/* ── Dialog ── */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Soruyu Gönder</DialogTitle>
            <DialogDescription>
              Sorunuzu göndermeden önce başlık ve kategori bilgilerini doldurun.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 py-2">
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Başlık */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="question-title">
                    Başlık <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="question-title"
                    placeholder="Sorunuzu kısaca özetleyin..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={150}
                  />
                  <p className="text-muted-foreground text-xs">
                    {title.length}/150
                  </p>
                </div>

                {/* Kategori */}
                <div className="flex flex-col gap-1.5">
                  <Label>
                    Kategori{" "}
                    <span className="text-muted-foreground text-xs">
                      (opsiyonel)
                    </span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.title ?? cat.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grup — opsiyonel */}
                <div className="flex flex-col gap-1.5">
                  <Label>
                    Grup{" "}
                    <span className="text-muted-foreground text-xs">
                      (opsiyonel)
                    </span>
                  </Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grup seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((grp) => (
                        <SelectItem key={grp.id} value={String(grp.id)}>
                          {(grp as any).title ?? (grp as any).name ?? grp.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Görünürlük */}
                <div className="flex flex-col gap-1.5">
                  <Label>
                    Görünürlük <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility("public")}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                        visibility === "public"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="text-base">🌍</span>
                      <span className="font-medium text-sm">Herkese Açık</span>
                      <span className="text-xs opacity-70">
                        Onaylandıktan sonra herkes görebilir
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("editors_only")}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                        visibility === "editors_only"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="text-base">🔒</span>
                      <span className="font-medium text-sm">
                        Sadece Editörler
                      </span>
                      <span className="text-xs opacity-70">
                        Yalnızca editörler ve sen görebilir
                      </span>
                    </button>
                  </div>
                </div>

                {/* Etiketler */}
                <div className="flex flex-col gap-1.5">
                  <Label>
                    Etiketler{" "}
                    <span className="text-muted-foreground text-xs">
                      (opsiyonel, max 5)
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.includes(String(tag.id));
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(String(tag.id))}
                          className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                          style={
                            tag.color && isSelected
                              ? {
                                  borderColor: `${tag.color}60`,
                                  backgroundColor: `${tag.color}15`,
                                  color: tag.color,
                                }
                              : tag.color
                                ? { borderColor: `${tag.color}30` }
                                : {}
                          }
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTags.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {selectedTags.length} etiket seçildi
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={loading}
            >
              İptal
            </Button>
            <Button onClick={submitQuestion} disabled={loading || dataLoading}>
              {loading ? (
                <>
                  <LoaderIcon className="mr-2 size-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <SendIcon className="mr-2 size-4" />
                  Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
