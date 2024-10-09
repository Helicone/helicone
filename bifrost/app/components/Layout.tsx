"use client";

import Footer from "@/components/layout/footer";
import NavBar from "@/components/layout/navbar";
import { usePathname } from "next/navigation";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();
  const isExperimentsWaitlist = path.includes("experiments");

  return (
    <>
      <NavBar />
      {children}
      {!isExperimentsWaitlist && <Footer />}
    </>
  );
};
