"use client";

import {
  CalendarIcon,
  UserIcon,
  MessageSquareIcon,
  EyeIcon,
  ThumbsUpIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import Balancer from "react-wrap-balancer";
import { BlurImage } from "@/components/blur-image";
import { Badge } from "@/components/ui/badge";
import type { Question, Tag, User, Media } from "@/payload-types";

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const {
    title,
    slug,
    content,
    author,
    tags,
    status,
    voteScore,
    answerCount,
    viewCount,
    endorsedAnswerCount,
    acceptedAnswer,
    createdAt,
  } = question;

  // Author bilgisi
  const authorName =
    typeof author === "object" ? (author as User).name : "Anonim";

  // Tags listesi
  const tagList = (tags as Tag[]) ?? [];

  // Tarih formatı
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // İçerikten düz metin özeti (richText ise JSON'dan çek)
  const getDescription = () => {
    if (!content) return "";
    if (typeof content === "string") return content;
    // Lexical JSON → düz metin
    try {
      const root = (content as any)?.root;
      const paragraphs = root?.children ?? [];
      return paragraphs
        .flatMap((p: any) => p?.children ?? [])
        .map((n: any) => n?.text ?? "")
        .join(" ")
        .slice(0, 200);
    } catch {
      return "";
    }
  };

  const description = getDescription();
  const url = `/sorular/${slug}`;
  const isSolved = Boolean(acceptedAnswer);
  const hasEndorsed = (endorsedAnswerCount ?? 0) > 0;

  return (
    <Link
      className="group grid grid-cols-1 gap-4 bg-card/50 px-6 py-6 transition-colors hover:bg-card/80 md:grid-cols-3 xl:grid-cols-4"
      href={url}
    >
      {/* ── Sol: İçerik ── */}
      <div className="order-2 flex h-full flex-col justify-between gap-4 md:order-1 md:col-span-3 xl:col-span-4">
        {/* Başlık + durum rozetleri */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Çözüldü rozeti */}
            {isSolved && (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-xs"
              >
                <CheckCircle2Icon className="size-3" />
                Çözüldü
              </Badge>
            )}
            {/* Editor onaylı görüş rozeti */}
            {hasEndorsed && (
              <Badge
                variant="outline"
                className="gap-1 border-blue-500/40 bg-blue-500/10 text-blue-600 text-xs"
              >
                <ShieldCheckIcon className="size-3" />
                {endorsedAnswerCount} Editör Görüşü
              </Badge>
            )}
            {/* Kapalı rozeti */}
            {status === "closed" && (
              <Badge
                variant="outline"
                className="border-destructive/40 bg-destructive/10 text-destructive text-xs"
              >
                Kapatıldı
              </Badge>
            )}
          </div>

          <h2 className="font-medium text-lg leading-snug md:text-xl lg:text-2xl">
            {title}
          </h2>

          {description && (
            <p className="line-clamp-2 overflow-hidden text-ellipsis text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tagList.map((tag) => {
                const t = tag as Tag;
                return (
                  <span
                    key={t.id}
                    className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-muted-foreground text-xs"
                    style={
                      t.color
                        ? { borderColor: `${t.color}40`, color: t.color }
                        : {}
                    }
                  >
                    {t.name}
                  </span>
                );
              })}
            </div>
          )}
          {/* Meta bilgiler */}
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
            {/* Yazar */}
            <span className="inline-flex items-center gap-1 capitalize">
              <UserIcon className="size-4" />
              {authorName}
            </span>

            <span className="text-border">•</span>

            {/* Tarih */}
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="size-4" />
              {formattedDate}
            </span>

            <span className="text-border">•</span>

            {/* Oy skoru */}
            <span
              className={`inline-flex items-center gap-1 ${
                (voteScore ?? 0) > 0
                  ? "text-emerald-600"
                  : (voteScore ?? 0) < 0
                    ? "text-destructive"
                    : ""
              }`}
            >
              <ThumbsUpIcon className="size-4" />
              {voteScore ?? 0}
            </span>

            <span className="text-border">•</span>

            {/* Cevap sayısı */}
            <span
              className={`inline-flex items-center gap-1 ${
                isSolved ? "text-emerald-600" : ""
              }`}
            >
              <MessageSquareIcon className="size-4" />
              {answerCount ?? 0} cevap
            </span>

            <span className="text-border">•</span>

            {/* Görüntülenme */}
            <span className="inline-flex items-center gap-1">
              <EyeIcon className="size-4" />
              {viewCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
