"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";

export async function createQuestion(data: {
  title: string;
  content: any;
  visibility: "public" | "editors_only";
  categoryId?: number;
  tagIds?: number[];
}) {
  try {
    const payload = await getPayload({ config });

    // Next.js headers() üzerinden gelen Auth bilgilerini Payload'a veriyoruz
    const reqHeaders = await headers();
    const { user } = await payload.auth({ headers: reqHeaders });

    if (!user) {
      return { success: false, error: "Lütfen giriş yapın." };
    }

    // Soruyu oluştur
    const question = await payload.create({
      collection: "questions",
      // ÖNEMLİ: Collection içindeki hook'ların (beforeChange) 'req.user'ı
      // görebilmesi için req objesini içeri aktarmalıyız!
      req: {
        user,
      } as any,
      data: {
        title: data.title,
        content: data.content,
        visibility: data.visibility,
        // Yazar ID'sini buradan da zorluyoruz
        author: user.id,
        status: "published",
        ...(data.categoryId && { category: data.categoryId }),
        ...(data.tagIds && data.tagIds.length > 0 && { tags: data.tagIds }),
      },
    });

    return { success: true, questionId: question.id, slug: question.slug };
  } catch (err: any) {
    console.error("createQuestion error:", err);
    return {
      success: false,
      error: err?.message ?? "Soru gönderilirken bir hata oluştu.",
    };
  }
}
