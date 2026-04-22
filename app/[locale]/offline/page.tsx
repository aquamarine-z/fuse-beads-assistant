import Link from "next/link";
import {CloudOff, ImagePlus, Palette} from "lucide-react";
import {getTranslations, setRequestLocale} from "next-intl/server";

export default async function OfflinePage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const t = await getTranslations("OfflinePage");

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_48%),linear-gradient(180deg,color-mix(in_oklab,var(--color-background)_92%,var(--color-accent)_8%),var(--color-background))] px-4 py-10 text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_38%),linear-gradient(180deg,color-mix(in_oklab,var(--color-background)_86%,var(--color-accent)_14%),var(--color-background))] sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-background/78 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-foreground/82">
            <CloudOff className="size-4" />
            {t("badge")}
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground/92 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/72 sm:text-base">
            {t("description")}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${locale}/pattern`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_30px_-20px_rgba(15,23,42,0.45)] transition hover:brightness-105"
            >
              {t("primary")}
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/86 px-5 py-3 text-sm font-semibold text-foreground/84 transition hover:bg-accent/50"
            >
              {t("secondary")}
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <article className="rounded-[1.5rem] border border-border/60 bg-background/74 p-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Palette className="size-5" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-foreground/90">
                {t("paletteTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {t("paletteBody")}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-border/60 bg-background/74 p-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ImagePlus className="size-5" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-foreground/90">
                {t("imageTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {t("imageBody")}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-border/60 bg-background/74 p-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CloudOff className="size-5" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-foreground/90">
                {t("tipsTitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/68">
                {t("tipsBody")}
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
