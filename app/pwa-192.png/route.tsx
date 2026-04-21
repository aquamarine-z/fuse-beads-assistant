import {ImageResponse} from "next/og";

import {PwaFruitIcon} from "@/lib/pwa-fruit-icon";

export async function GET() {
  return new ImageResponse(<PwaFruitIcon size={192} />, {
    width: 192,
    height: 192,
  });
}
