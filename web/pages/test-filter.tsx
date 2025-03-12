import { FilterProvider } from "@/filterAST/context/filterContext";
import { TestFilterPage } from "@/filterAST/examplePage";
import React from "react";

const DefaultTestFilterPage: React.FC = () => {
  return (
    <FilterProvider>
      <TestFilterPage />
    </FilterProvider>
  );
};

export default DefaultTestFilterPage;
