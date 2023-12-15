const getPromptValues = async () => {
  const resp = await fetch("/api/prompt_values");
  const data = await resp.json();
  return data;
};

export { getPromptValues };
