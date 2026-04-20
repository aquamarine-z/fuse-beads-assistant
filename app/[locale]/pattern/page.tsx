import {setRequestLocale} from "next-intl/server";

import {PatternStudio} from "@/components/pattern-studio";

export default async function PatternPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  return <PatternStudio />;
}
