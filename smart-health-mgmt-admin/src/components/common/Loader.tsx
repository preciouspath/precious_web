import { Loader2 } from "lucide-react";

interface LoaderProps {
  text?: string;
  minHeight?: string;
}

export default function Loader({
  text = "Loading...",
  minHeight = "300px",
}: LoaderProps) {
  return (
    <div
      className="w-full flex flex-col items-center justify-center gap-4"
      style={{ minHeight }}
    >
      <Loader2 className="w-8 h-8 animate-spin text-[#734A97]" />
      <p className="text-sm font-bold text-gray-500 tracking-wide">
        {text}
      </p>
    </div>
  );
}
