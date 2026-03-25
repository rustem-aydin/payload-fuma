"use client";

import type React from "react";
import { useState } from "react";
import { UserIcon, SendIcon } from "lucide-react";

interface CommentsSectionProps {
  bookId: number | string;
  initialCommentCount: number;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  bookId,
  initialCommentCount,
}) => {
  const [commentText, setCommentText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // BURAYA PAYLOAD CMS POST İSTEĞİ GELECEK
    // fetch('/api/comments', { method: 'POST', body: JSON.stringify({ book: bookId, content: commentText }) })

    alert("Yorumunuz gönderildi! (API entegrasyonu bekleniyor)");
    setCommentText("");
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Yorumlar</h2>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {initialCommentCount} Yorum
        </span>
      </div>

      {/* Yorum Ekleme Formu */}
      <div className="flex gap-4 mb-12">
        <div className="shrink-0">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted border border-border">
            <UserIcon className="size-6 text-muted-foreground" />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Bu kitap hakkında ne düşünüyorsunuz?..."
              className="w-full min-h-[120px] rounded-xl border border-border bg-card/50 p-4 pb-12 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y"
              required
            />
            <div className="absolute bottom-3 right-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                disabled={!commentText.trim()}
              >
                Gönder <SendIcon className="size-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Örnek Yorum Listesi (Daha sonra harita / map ile dönülecek) */}
      <div className="space-y-6">
        {initialCommentCount === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
            İlk yorumu siz yapın!
          </div>
        ) : (
          // Payload API'den yorumları çektikten sonra burası map'lenecek
          <div className="flex gap-4 p-6 rounded-xl bg-card border border-border/50">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              AE
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Ali Ekber</span>
                <span className="text-xs text-muted-foreground">
                  • 2 gün önce
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bu kitap için hazırlanan detay sayfası gerçekten harika
                görünüyor. Kullanıcı deneyimi çok yüksek.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
