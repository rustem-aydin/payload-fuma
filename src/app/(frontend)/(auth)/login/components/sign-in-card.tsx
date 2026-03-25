"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { login, type LoginResponse } from "../../actions/login";

const Cross = () => (
  <div className="relative h-6 w-6">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <Icons.add className="text-border/70 dark:text-border" size={20} />
    </div>
  </div>
);

export interface SignInCardProps {
  redirectTo: string;
}

export function SignInCard({ redirectTo }: SignInCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    console.log(email);
    console.log(password);
    const result: LoginResponse = await login({ email, password });
    setIsLoading(false);

    if (result.success) {
      // this doesn't exist yet, but it will, so let's set it up now.
      router.push("/");
    } else {
      toast.error(result.error || "Giriş Yapılamadı");
    }
  }

  const handleGoogleSignIn = () => {
    if (isLoading) return;
    setIsLoading(true);
    // Payload'un Google OAuth endpoint'i
    const callback = encodeURIComponent(redirectTo);
    window.location.href = `/api/users/oauth/google?redirect=${callback}`;
  };

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -top-3 -left-3 z-10 hidden h-6 sm:block">
        <Cross />
      </div>
      <div className="absolute top-1 -right-3 z-10 hidden h-6 sm:block">
        <Cross />
      </div>

      <div className={cn("border-border border-x border-y border-dashed")}>
        <Card className="rounded-none border-none">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Giriş Yap</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Giriş Yapmak için Formu Doldurunuz
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="rounded-none border-dashed shadow-none"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="rounded-none border-dashed shadow-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-none shadow-none">
                {isLoading && (
                  <Icons.spinner className="mr-2 size-4 animate-spin" />
                )}
                Giriş Yap
              </Button>
              {/* 
              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 border-t border-dashed border-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 border-t border-dashed border-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  window.location.href = `/api/users/oauth/google?redirect=${encodeURIComponent(redirectTo)}`;
                }}
                className={cn(
                  "w-full gap-2 rounded-none border border-dashed border-border shadow-none",
                )}
              >
                <Icons.google />
                Google Giriş
              </Button> */}
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="absolute -bottom-3 -left-3 z-10 hidden h-6 sm:block">
        <Cross />
      </div>
      <div className="absolute -right-3 -bottom-3 z-10 hidden h-6 -translate-x-px sm:block">
        <Cross />
      </div>
    </div>
  );
}
