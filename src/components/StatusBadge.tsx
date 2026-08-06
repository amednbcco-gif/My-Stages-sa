import { Badge } from "./ui";
import { statusLabel } from "../lib/stages";
import type { StatusValue } from "../lib/types";

export function StatusBadge({ value }: { value: StatusValue | string }) {
  const colorMap: Record<string, string> = {
    pending: "amber",
    inprogress: "sky",
    submitted: "gold",
    approved: "emerald",
  };
  const color = colorMap[value] ?? "gray";
  return <Badge color={color}>{statusLabel(value)}</Badge>;
}
