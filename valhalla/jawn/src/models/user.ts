export interface User {
  id: number;
  email: string;
  name: string;
  status?: "Happy" | "Sad";
  status2?: "Happy" | "Sad";
  phoneNumbers: string[];
}
