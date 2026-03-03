import { Layout } from "@/app/components/Layout";

export default function MintlifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
