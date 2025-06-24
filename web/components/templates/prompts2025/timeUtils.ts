export const formatTime = (date: Date, prefix: string) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${prefix} ${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${prefix} ${diffInHours}h ago`;
  } else {
    return `${prefix} ${diffInDays}d ago`;
  }
};
