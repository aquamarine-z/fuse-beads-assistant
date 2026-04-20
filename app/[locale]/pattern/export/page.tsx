import { setRequestLocale } from "next-intl/server";

import { PatternExportViewer } from "@/components/pattern-export-viewer";

export default async function PatternExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PatternExportViewer />;
}
