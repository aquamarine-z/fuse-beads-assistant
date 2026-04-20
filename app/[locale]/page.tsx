import {Sparkles, Languages, Route} from "lucide-react";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {Badge} from "@/components/ui/badge";
import {buttonVariants} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {TitlebarControls} from "@/components/titlebar-controls";
import {Link} from "@/i18n/navigation";

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex items-center justify-end">
          <TitlebarControls />
        </header>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              <Sparkles className="mr-2 size-4 text-primary" />
              {t("eyebrow")}
            </Badge>
            <div className="flex max-w-3xl flex-col gap-4">
              <h1 className="font-heading text-5xl font-semibold tracking-tight text-balance md:text-7xl">
                {t("title")}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                {t("description")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pattern"
                className={buttonVariants({size: "lg", className: "rounded-2xl"})}
              >
                {t("primary")}
              </Link>
              <a
                href="#overview"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "rounded-2xl",
                })}
              >
                {t("secondary")}
              </a>
            </div>
          </div>

          <div id="overview" className="grid gap-4">
            <InfoCard
              icon={<Route className="size-5 text-primary" />}
              title={t("routeTitle")}
              body={t("routeBody")}
            />
            <InfoCard
              icon={<Languages className="size-5 text-primary" />}
              title={t("langTitle")}
              body={t("langBody")}
            />
            <InfoCard
              icon={<Sparkles className="size-5 text-primary" />}
              title={t("cardTitle")}
              body={t("cardBody")}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="rounded-[2rem] border-white/60 bg-white/70 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">{icon}{title}</CardTitle>
        <CardDescription className="text-sm leading-7">{body}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
