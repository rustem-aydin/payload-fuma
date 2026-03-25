import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { Header } from "@/components/sections/header";
import { linkItems } from "@/constants/navigation";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <HomeLayout
      className="pt-0"
      links={linkItems}
      nav={{
        component: (
          <Header links={linkItems} themeSwitch={{ enabled: false }} />
        ),
      }}
    >
      <main className="container relative flex min-h-full flex-1 border-border border-x border-b border-dashed">
        {children}
      </main>
    </HomeLayout>
  );
};

export default Layout;
