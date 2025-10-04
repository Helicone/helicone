import { IslandContainer } from "@/components/ui/islandContainer";
import AuthHeader from "../../shared/authHeader";
import React from "react";

interface DeveloperPageProps {
  title: string;
  children: React.ReactNode;
}

const DeveloperPage: React.FC<DeveloperPageProps> = ({ title, children }) => {
  return (
    <>
      <IslandContainer>
        <AuthHeader title={title} />
        {children}
      </IslandContainer>
    </>
  );
};

export default DeveloperPage;
