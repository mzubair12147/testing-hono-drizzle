import { randomUUID } from "crypto";

export const uuid = () => randomUUID();

export function parseTtl(s: string): number {
  const m = s.match(/^(\d+)([smhd])$/);
  if (!m) throw new Error("Bad TTL");
  const n = Number(m[1]);
  switch (m[2]) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
  }
  return n;
}
