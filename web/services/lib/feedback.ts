const getFeedback = async () => {
  const resp = await fetch("/api/feedback");
  const data = await resp.json();
  return data;
};

export { getFeedback };
