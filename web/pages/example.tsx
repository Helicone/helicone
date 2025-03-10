import React from "react";
import FilterASTEditor from "@/filterAST/FilterASTEditor";
import { H1, P } from "@/components/ui/typography";
import { FilterExpression } from "@/filterAST/filterAst";
import BasePageV2 from "@/components/layout/basePageV2";

const ExamplePage: React.FC = () => {
  const handleFilterChange = (filter: FilterExpression) => {
    console.log("Filter changed:", filter);
  };

  return (
    <BasePageV2>
      <div className="container mx-auto py-8">
        <H1 className="mb-6">Filter Example</H1>
        <P className="mb-6">
          This page demonstrates the new FilterASTEditor component. Try creating
          some filters below.
        </P>

        <div className="border rounded-lg p-6 bg-card">
          <FilterASTEditor
            onFilterChange={handleFilterChange}
            layoutPage="requests"
          />
        </div>
      </div>
    </BasePageV2>
  );
};

export default ExamplePage;
