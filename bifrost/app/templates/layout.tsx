import type React from "react";
import { Layout } from "@/app/components/Layout";

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
