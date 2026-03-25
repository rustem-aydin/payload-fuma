import Link from "next/link";
import { Icons } from "@/components/icons/icons";
import { cn } from "@/lib/utils";

export const TagCard = ({
  name,
  count = 0,
  className = "",
}: {
  name: string;
  count?: number;
  className?: string;
}) => {
  return (
    <Link
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg bg-card/50 px-3 py-2 text-sm transition-colors hover:bg-card/80",
        className,
      )}
      href={`/tags/${name}`}
    >
      <Icons.tag
        className="my-auto text-muted-foreground transition-transform group-hover:rotate-12"
        size={18}
      />
      <span className="text-card-foreground">{name}</span>
      {count && (
        <span className="ml-auto text-muted-foreground">({count})</span>
      )}
    </Link>
  );
};
