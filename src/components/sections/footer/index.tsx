import { ViewAnimation } from "@/components/view-animation";
import { owner } from "@/constants/site";
import { cn } from "@/lib/utils";
import { Links } from "./links";

export const Footer = () => (
  <footer
    className={cn(
      "container mx-auto flex flex-col gap-4 px-4 py-8",
      "border-border border-b border-dashed",
      "sm:gap-16 sm:px-8 sm:py-16",
    )}
  >
    <Links />
    <div className="grid items-center gap-4 sm:grid-cols-3">
      <div className="flex items-center sm:justify-center">
        <ViewAnimation
          delay={0.15}
          initial={{ opacity: 0, translateY: -6 }}
          whileInView={{ opacity: 1, translateY: 0 }}
        >
          <p className="whitespace-nowrap text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} {owner}. All rights reserved.
          </p>
        </ViewAnimation>
      </div>
    </div>
  </footer>
);
