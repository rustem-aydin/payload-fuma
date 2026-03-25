"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { UserAvatarClassNames } from "./user-avatar";
import type { User } from "@/payload-types";
import { getUser } from "@/app/(frontend)/(auth)/actions/get-user";

export interface UserButtonClassNames {
  base?: string;
  skeleton?: string;
  trigger?: {
    base?: string;
    avatar?: UserAvatarClassNames;
    skeleton?: string;
  };
  content?: {
    base?: string;
    avatar?: UserAvatarClassNames;
    menuItem?: string;
    separator?: string;
  };
}

export interface UserButtonProps {
  className?: string;
  classNames?: UserButtonClassNames;
}

export function UserButton({ className, classNames }: UserButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Better Auth yerine lokal state kullanıyoruz
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        // Payload'dan dönen user bilgisini al
        const currentUser = await getUser();
        if (currentUser) {
          setUser(currentUser as User);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Kullanıcı bilgisi alınamadı:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  // Payload CMS üzerinden güvenli çıkış yapma
  const handleSignOut = async () => {
    try {
      // Payload'un yerleşik logout endpoint'ine istek atıyoruz (Koleksiyon slug'ı 'users' varsayılmıştır)
      await fetch("/api/users/logout", { method: "POST" });
      setUser(null);
      router.refresh();
      router.push("/");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={cn("rounded-md bg-transparent")}>
        <Button
          aria-label={"User Menu"}
          className={cn(
            "size-auto rounded-md border-none bg-transparent p-0 hover:bg-accent dark:hover:bg-accent",
            "bg-secondary hover:bg-secondary/80",
            classNames?.trigger?.base,
          )}
          disabled={isLoading}
          variant="ghost"
        >
          {isLoading ? (
            <Skeleton
              className={cn(
                "size-8 rounded-md",
                className,
                classNames?.base,
                classNames?.skeleton,
                classNames?.trigger?.skeleton,
              )}
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 truncate font-medium text-sm">
              <Icons.user className="size-4" />
              {user ? user.name || "Hesabım" : "Giriş Yap"}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn("w-56", classNames?.content?.base)}
        onCloseAutoFocus={(e) => e.preventDefault()}
        side="bottom"
      >
        {user ? (
          <div className="flex flex-col space-y-1 p-2">
            <p className="truncate font-medium text-sm">
              {user.name || "Kullanıcı"}
            </p>
            {user.email && (
              <p className="truncate text-muted-foreground text-xs">
                {user.email}
              </p>
            )}
          </div>
        ) : (
          <div className="px-2 py-1.5 text-muted-foreground text-xs">
            Misafir
          </div>
        )}

        <DropdownMenuSeparator className={classNames?.content?.separator} />

        {user ? (
          <>
            <DropdownMenuItem asChild className={classNames?.content?.menuItem}>
              <Link href="/account" className="cursor-pointer">
                <Icons.user className="mr-2 size-4" />
                Hesabım
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className={classNames?.content?.separator} />

            <DropdownMenuItem
              className={cn(
                classNames?.content?.menuItem,
                "cursor-pointer text-destructive focus:text-destructive",
              )}
              onClick={handleSignOut}
            >
              <Icons.logOut className="mr-2 size-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild className={classNames?.content?.menuItem}>
            {/* Yönlendirme işlemi için login sayfasına gidiyoruz */}
            <Link
              href={`/login?redirect=${pathname}`}
              className="cursor-pointer"
            >
              <Icons.logIn className="mr-2 size-4" />
              Giriş Yap
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
