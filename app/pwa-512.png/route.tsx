import {ImageResponse} from "next/og";

import {PwaFruitIcon} from "@/lib/pwa-fruit-icon";

export async function GET() {
  return new ImageResponse(<PwaFruitIcon size={512} />, {
    width: 512,
    height: 512,
  });
}
