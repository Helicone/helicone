export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();

  // If the date is from today, show relative time
  if (date.toDateString() === now.toDateString()) {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  }

  // Otherwise use the original date format
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
