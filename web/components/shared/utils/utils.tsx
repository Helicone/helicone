const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const timeAgo = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const secondsPast = (now.getTime() - date.getTime()) / 1000;

  if (secondsPast < 60) {
    return "seconds ago";
  }
  if (secondsPast < 3600) {
    let minutes = Math.round(secondsPast / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (secondsPast <= 86400) {
    let hours = Math.round(secondsPast / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (secondsPast <= 2592000) {
    let days = Math.round(secondsPast / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (secondsPast > 2592000 && secondsPast <= 31536000) {
    let months = Math.round(secondsPast / 2592000);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }

  const years = Math.round(secondsPast / 31536000);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

const getUSDateShort = (value: string) => {
  const date = new Date(value);
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
};

const getUSDate = (value: string) => {
  const date = new Date(value);
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}, ${date.toLocaleTimeString().slice(0, -6)} ${date
    .toLocaleTimeString()
    .slice(-2)}`;
};

const getUSDateMin = (value: string) => {
  const date = new Date(value);
  const day = date.getDate();
  return `${date.getMonth()}/${day}/${date
    .getFullYear()
    .toString()
    .slice(-2)}, ${date.toLocaleTimeString().slice(0, -6)} ${date
    .toLocaleTimeString()
    .slice(-2)}`;
};

const capitalizeWords = (str: string) => {
  // replace underscores with spaces
  const strWithSpaces = str.replace(/_/g, " ");

  // split the string into an array of words
  const words = strWithSpaces.split(" ");

  // map over each word and capitalize the first letter
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );

  // join the capitalized words back into a single string
  return capitalizedWords.join(" ");
};

function removeLeadingWhitespace(str: string): string {
  return str.replace(/^\s+/, ""); // Replace one or more whitespace characters at the beginning of the string with an empty string
}

export {
  getUSDate,
  getUSDateShort,
  capitalizeWords,
  removeLeadingWhitespace,
  getUSDateMin,
  timeAgo,
};
