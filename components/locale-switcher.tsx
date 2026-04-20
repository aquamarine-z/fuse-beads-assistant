"use client";

import {useParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {usePathname, useRouter} from "@/i18n/navigation";
import {routing, type AppLocale} from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
    <Select
      value={locale}
      onValueChange={(nextLocale) => {
        router.replace(
          // @ts-expect-error next-intl typed navigation accepts runtime params
          {pathname, params},
          {locale: nextLocale as AppLocale}
        );
      }}
    >
      <SelectTrigger aria-label={t("label")} className="w-full min-w-0 rounded-2xl bg-background/75 sm:w-auto sm:min-w-36">
        <SelectValue>{t(locale as AppLocale)}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[24rem]">
        <SelectGroup>
          {routing.locales.map((item) => (
            <SelectItem key={item} value={item}>
              {t(item)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
