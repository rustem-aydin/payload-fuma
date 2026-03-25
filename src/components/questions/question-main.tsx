import { getPayload } from "payload";
import config from "@payload-config";
import QuestionEditor from "../editor/editor";
import { QuestionCard } from "./question-card";

interface QuestionMainProps {
  // Opsiyonel filtreler — URL search params'dan gelebilir
  tag?: string; // tag slug'a göre filtre
  category?: string; // category id'ye göre filtre
  search?: string; // başlık araması
  page?: number; // sayfalama
}

const QUESTIONS_PER_PAGE = 10;

const QuestionMain = async ({
  tag,
  category,
  search,
  page = 1,
}: QuestionMainProps) => {
  const payload = await getPayload({ config });

  // ── Where koşulları ──────────────────────────────────────
  // Sadece approved sorular listelenir (SEO + kalite)
  const where: Record<string, any> = {
    status: { equals: "published" },
  };

  if (search) {
    where["title"] = { contains: search };
  }

  if (category) {
    where["category"] = { equals: category };
  }

  // Tag slug'a göre filtre
  if (tag) {
    // Önce tag'i bul
    const tagResult = await payload.find({
      collection: "tags",
      where: { slug: { equals: tag } },
      limit: 1,
    });

    if (tagResult.docs.length > 0) {
      where["tags"] = { contains: tagResult?.docs[0]?.id };
    }
  }

  // ── Payload sorgusu ──────────────────────────────────────
  const result = await payload.find({
    collection: "questions",
    where,
    sort: "-createdAt", // en yeni sorular önce
    limit: QUESTIONS_PER_PAGE,
    page,
    depth: 2, // author, tags, acceptedAnswer populate olsun
  });

  const questions = result.docs;
  const totalPages = result.totalPages;
  const totalDocs = result.totalDocs;
  console.log(result);
  return (
    <div className="flex flex-col gap-0">
      {/* Soru yazma editörü */}
      <QuestionEditor />

      {/* Soru listesi başlığı */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <p className="text-muted-foreground text-sm">
          {totalDocs} soru bulundu
        </p>
        {/* İleride: sıralama seçenekleri (en yeni, en çok oylanan, çözülmemiş) */}
      </div>

      {/* Soru kartları */}
      {questions.length > 0 ? (
        <div className="divide-y divide-border">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question as any} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="font-medium text-lg">Henüz soru yok</p>
          <p className="text-muted-foreground text-sm">
            İlk soruyu soran sen ol.
          </p>
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-border px-6 py-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}`}
              className={`flex size-8 items-center justify-center rounded-md text-sm transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionMain;
