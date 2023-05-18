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

const getUSDateShort = (value: string) => {
  const date = new Date(value);
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
};

// const getUSDate = (value: string) => {
//   const date = new Date(value);
//   const month = monthNames[date.getMonth()];
//   const day = date.getDate();
//   return `${month} ${day}, ${date.toLocaleTimeString().slice(0, -6)} ${date
//     .toLocaleTimeString()
//     .slice(-2)}`;
// };

const getUSDate = (value: string) => {
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  };
  
  return date.toLocaleString('en-US', options);
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
};
