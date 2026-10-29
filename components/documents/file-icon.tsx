import { FileSpreadsheet, FileText, File as FileGeneric } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileIcon({ type, className }: { type: string; className?: string }) {
  const t = type.toUpperCase();
  const map: Record<string, { Icon: typeof FileText; cls: string }> = {
    PDF: { Icon: FileText, cls: "bg-red-50 text-red-600" },
    DOCX: { Icon: FileText, cls: "bg-blue-50 text-blue-600" },
    DOC: { Icon: FileText, cls: "bg-blue-50 text-blue-600" },
    XLSX: { Icon: FileSpreadsheet, cls: "bg-emerald-50 text-emerald-600" },
    XLS: { Icon: FileSpreadsheet, cls: "bg-emerald-50 text-emerald-600" },
    CSV: { Icon: FileSpreadsheet, cls: "bg-emerald-50 text-emerald-600" },
  };
  const { Icon, cls } = map[t] ?? { Icon: FileGeneric, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", cls, className)}>
      <Icon className="size-4" />
    </span>
  );
}
