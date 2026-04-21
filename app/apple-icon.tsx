import {ImageResponse} from "next/og";

import {PwaFruitIcon} from "@/lib/pwa-fruit-icon";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<PwaFruitIcon size={180} />, size);
}
