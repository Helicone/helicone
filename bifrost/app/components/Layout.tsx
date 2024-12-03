"use client";

import Footer from "@/components/layout/footer";
import NavBar from "@/components/layout/navbar";
import { usePathname } from "next/navigation";

export const Layout = ({
  children,
  stars,
}: {
  children: React.ReactNode;
  stars: number;
}) => {
  const path = usePathname();
  const showFooter = !path.includes("experiments");

  return (
    <>
      <NavBar stars={stars} />
      {children}
      {showFooter && <Footer />}
    </>
  );
};
