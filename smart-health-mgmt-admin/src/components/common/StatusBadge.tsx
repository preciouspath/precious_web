interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const base =
    "inline-flex items-center text-xs font-medium px-3 py-1 rounded-full capitalize";

  const colorMap: Record<string, string> = {
    Approved: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Rejected: "bg-red-100 text-red-700",
    Active: "bg-blue-100 text-blue-700",
    Disabled: "bg-gray-100 text-gray-700",
    Premium: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={`${base} ${colorMap[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
