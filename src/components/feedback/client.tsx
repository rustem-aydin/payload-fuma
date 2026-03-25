"use client";
import { cn } from "../../lib/cn";
import { Button, buttonVariants } from "../ui/button";
import { CornerDownRightIcon, MessageSquare } from "lucide-react";
import {
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
} from "react";
import { usePathname } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { FeedbackBlockProps } from "fumadocs-core/mdx-plugins/remark-feedback-block";
import {
  actionResponse,
  blockFeedback,
  type ActionResponse,
  type BlockFeedback,
} from "./schema";
import { z } from "zod/mini";

const blockFeedbackResult = z.extend(blockFeedback, {
  response: actionResponse,
});

export function FeedbackBlock({
  id,
  body,
  onSendAction,
  children,
}: FeedbackBlockProps & {
  onSendAction: (feedback: BlockFeedback) => Promise<ActionResponse>;
  children: ReactNode;
}) {
  const url = usePathname();
  const blockId = `${url}-${id}`;
  const { previous, setPrevious } = useSubmissionStorage(blockId, (v) => {
    const result = blockFeedbackResult.safeParse(v);
    if (result.success) return result.data;
    return null;
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"comment" | "question">("comment"); // ← yeni

  function submit(e?: SyntheticEvent) {
    startTransition(async () => {
      const feedback: BlockFeedback = {
        blockId,
        blockBody: body,
        url,
        message: `[${mode === "question" ? "Soru" : "Yorum"}] ${message}`, // ← modu mesaja ekle
      };

      const response = await onSendAction(feedback);
      setPrevious({ response, ...feedback });
      setMessage("");
    });

    e?.preventDefault();
  }

  const triggerClass = cn(
    buttonVariants({ variant: "secondary", size: "sm" }),
    "backdrop-blur-sm text-fd-muted-foreground gap-1.5 transition-all duration-100 data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground",
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative group/feedback">
        <div
          className={cn(
            "absolute -inset-1 rounded-sm pointer-events-none transition-colors duration-100 z-[-1]",
            open
              ? "bg-fd-accent"
              : "group-hover/feedback:bg-fd-accent group-hover/feedback:delay-100",
          )}
        />

        {/* İki buton yan yana */}
        <div
          className={cn(
            "absolute -top-7 end-0 flex gap-1",
            !open &&
              "opacity-0 pointer-events-none group-hover/feedback:pointer-events-auto group-hover/feedback:opacity-100 group-hover/feedback:delay-100",
          )}
        >
          <PopoverTrigger
            className={triggerClass}
            onClick={(e) => {
              setMode("comment");
              setOpen((prev) => (mode === "comment" ? !prev : true));
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <MessageSquare className="size-3.5" />
            Yorum Yap
          </PopoverTrigger>

          <PopoverTrigger
            className={triggerClass}
            onClick={(e) => {
              setMode("question");
              setOpen((prev) => (mode === "question" ? !prev : true));
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <MessageSquare className="size-3.5" />
            Soru Sor
          </PopoverTrigger>
        </div>

        <div className="in-[.prose-no-margin]:prose-no-margin">{children}</div>
      </div>

      <PopoverContent className="min-w-[300px] bg-fd-card text-fd-card-foreground">
        {previous ? (
          <div className="flex flex-col items-center py-2 gap-2 text-fd-muted-foreground text-sm text-center rounded-xl">
            <p>Geri bildiriminiz için teşekkürler!</p>
            <div className="flex flex-row items-center gap-2">
              <a
                href={previous.response?.githubUrl}
                rel="noreferrer noopener"
                target="_blank"
                className="text-xs bg-primary"
              >
                GitHub'da Görüntüle
              </a>
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => setPrevious(null)}
              >
                Tekrar Gönder
              </Button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-2" onSubmit={submit}>
            <p className="text-sm font-medium text-fd-foreground">
              {mode === "question" ? "Sorunuzu yazın" : "Yorumunuzu yazın"}
            </p>
            <textarea
              autoFocus
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border rounded-lg bg-fd-secondary text-fd-secondary-foreground p-3 resize-none focus-visible:outline-none placeholder:text-fd-muted-foreground"
              placeholder={
                mode === "question"
                  ? "Sorunuzu buraya yazın..."
                  : "Yorumunuzu buraya yazın..."
              }
              onKeyDown={(e) => {
                if (!e.shiftKey && e.key === "Enter") submit(e);
              }}
            />
            <button
              type="submit"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "gap-1.5",
              )}
              disabled={isPending}
            >
              <CornerDownRightIcon className="text-fd-muted-foreground size-4" />
              Gönder
            </button>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}

function useSubmissionStorage<Result>(
  blockId: string,
  validate: (v: unknown) => Result | null,
) {
  const storageKey = `docs-feedback-${blockId}`;
  const [value, setValue] = useState<Result | null>(null);
  const validateCallback = useEffectEvent(validate);

  useEffect(() => {
    const item = localStorage.getItem(storageKey);
    if (item === null) return;
    const validated = validateCallback(JSON.parse(item));

    if (validated !== null) setValue(validated);
  }, [storageKey]);

  return {
    previous: value,
    setPrevious(result: Result | null) {
      if (result) localStorage.setItem(storageKey, JSON.stringify(result));
      else localStorage.removeItem(storageKey);

      setValue(result);
    },
  };
}
