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

const getUSDate = (value: string) => {
  const date = new Date(value);
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}, ${date.toLocaleTimeString().slice(0, -6)} ${date
    .toLocaleTimeString()
    .slice(-2)}`;
};

export { getUSDate, getUSDateShort };
