interface TagsSummaryProps {
  tags: string[];
  maxCharacters?: number;
  className?: string;
}

const TagsSummary = ({ 
  tags, 
  maxCharacters,
  className = ""
}: TagsSummaryProps) => {
  if (tags.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">No tags</span>
    );
  }

  const visibleTags = [];
  let totalCharacters = 0;
  
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const tagLength = tag.length;
    
    if (i === 0) {
      visibleTags.push(tag);
      totalCharacters += tagLength;
    } else {
      if (maxCharacters) {
        if (totalCharacters + tagLength <= maxCharacters) {
          visibleTags.push(tag);
          totalCharacters += tagLength;
        } else {
          break;
        }
      } else {
        visibleTags.push(tag);
      }
    }
  }

  const remainingCount = tags.length - visibleTags.length;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visibleTags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center rounded-xl bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700"
        >
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center rounded-xl bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

export default TagsSummary; 