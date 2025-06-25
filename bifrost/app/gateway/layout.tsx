import { Layout } from "@/app/components/Layout";

export default function RootLayount({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
