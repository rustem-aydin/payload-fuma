import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared"; // ← buraya dikkat!
import type { ReactNode } from "react";
import { source } from "@/lib/source/docs";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ "--fd-layout-width": "1537px" } as React.CSSProperties}>
      <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
        {children}
      </DocsLayout>
    </div>
  );
}
