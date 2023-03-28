interface User {
  id: string;
}

export async function queryUser(
  root: any,
  args: {},
  context: any,
  info: any
): Promise<User> {
  return {
    id: "Helllo",
  };
}
