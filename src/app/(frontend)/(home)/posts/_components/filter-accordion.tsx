"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/icons/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ViewAnimation } from "@/components/view-animation";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

const MAX_CATEGORIES = 8;

interface FilterAccordionProps {
  categories: Array<{ name: string; slug: string; count: number }>;
}

export function FilterAccordion({ categories }: FilterAccordionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState<string>(
    searchParams.get("search") ?? "",
  );

  const selectedCategories = searchParams.getAll("categories");
  const displayedCategories = categories.slice(0, MAX_CATEGORIES);
  const hasMoreCategories = categories.length > MAX_CATEGORIES;

  // Debounce için timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL'yi güncelleyen yardımcı fonksiyon
  const updateURL = useCallback(
    (newSearch: string, newCategories: string[]) => {
      const params = new URLSearchParams();
      if (newSearch) params.set("search", newSearch);
      newCategories.forEach((c) => params.append("categories", c));
      router.push(`/posts?${params.toString()}`);
    },
    [router],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateURL(value, selectedCategories);
    }, 300);
  };

  const handleCategoryToggle = (slug: string) => {
    const newCats = selectedCategories.includes(slug)
      ? selectedCategories.filter((c) => c !== slug)
      : [...selectedCategories, slug];
    updateURL(search, newCats);
  };

  // URL dışarıdan değişirse (örn. geri tuşu) input'u senkronize et
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  return (
    <Accordion collapsible type="single">
      <AccordionItem className="border-0" value="categories">
        <AccordionTrigger className="py-0 hover:no-underline">
          <span className="flex items-center gap-2 text-sm">
            <Icons.funnel className="size-4" />
            Filtrele
          </span>
        </AccordionTrigger>
        <AccordionContent className="pt-3 pb-0 mx-2">
          {/* Arama */}
          <div className="flex flex-1 flex-col mb-4">
            <span>Arama</span>
            <div className="flex flex-col">
              <ViewAnimation
                initial={{ opacity: 0, translateY: -6 }}
                whileInView={{ opacity: 1, translateY: 0 }}
              >
                <InputGroup className="bg-background! border border-dashed h-10 rounded-none hover:border-0 shadow-none">
                  <InputGroupAddon className="border-0 text-muted-foreground">
                    <Search className="size-4 transition-transform hover:rotate-90 hover:scale-125" />
                  </InputGroupAddon>
                  <InputGroupInput
                    className={cn("text-sm")}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Yazı ve içerik ara..."
                    value={search}
                  />
                  {search.length > 0 && (
                    <InputGroupAddon
                      align="inline-end"
                      className="cursor-pointer"
                      onClick={() => {
                        setSearch("");
                        updateURL("", selectedCategories);
                      }}
                    >
                      temizle
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </ViewAnimation>
            </div>
          </div>

          {/* Kategoriler */}
          <div>
            <span>Popüler Kategoriler</span>
            <div className="grid grid-cols-2 gap-px border border-border border-dashed bg-border">
              {displayedCategories.map((category, index) => {
                const isSelected = selectedCategories.includes(category.slug);
                return (
                  <ViewAnimation
                    delay={0.05 * index}
                    initial={{ opacity: 0 }}
                    key={category.slug}
                    whileInView={{ opacity: 1 }}
                  >
                    <button
                      onClick={() => handleCategoryToggle(category.slug)}
                      className={cn(
                        "flex w-full items-center justify-between bg-background p-3 text-sm transition-colors hover:bg-card/80",
                        isSelected
                          ? "text-purple-500 font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs">({category.count})</span>
                    </button>
                  </ViewAnimation>
                );
              })}
            </div>
          </div>

          <Link
            className="group mt-3 flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
            href="/categories"
          >
            {hasMoreCategories
              ? `Tüm ${categories.length} kategoriyi görüntüle`
              : "Tüm Kategorileri Görüntüle"}
            <Icons.arrowRight className="size-4 transition-transform group-hover:-rotate-45" />
          </Link>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
