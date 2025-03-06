import React, { useState } from "react";
import { FilterASTEditor } from "@/components/shared/themed/filterAST/filters";
import {
  createDefaultFilter,
  createDefaultPropertyFilter,
  createDefaultScoreFilter,
  FilterExpression,
  toSqlWhereClause,
} from "@/services/lib/filters/filterAst";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code } from "@/components/ui/code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestFilterPage() {
  const [filter, setFilter] = useState<FilterExpression>(createDefaultFilter());

  const handleFilterChange = (newFilter: FilterExpression) => {
    setFilter(newFilter);
  };

  const handleReset = () => {
    setFilter(createDefaultFilter());
  };

  const handleSetPropertyFilter = () => {
    setFilter(createDefaultPropertyFilter());
  };

  const handleSetScoreFilter = () => {
    setFilter(createDefaultScoreFilter());
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Filter AST Editor Test</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <FilterASTEditor
              filter={filter}
              onChange={handleFilterChange}
              className="mb-4"
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleReset} variant="outline">
                Reset Filter
              </Button>
              <Button onClick={handleSetPropertyFilter} variant="outline">
                Property Filter Example
              </Button>
              <Button onClick={handleSetScoreFilter} variant="outline">
                Score Filter Example
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="json">
          <TabsList className="mb-2">
            <TabsTrigger value="json">Filter JSON</TabsTrigger>
            <TabsTrigger value="sql">SQL Where Clause</TabsTrigger>
          </TabsList>

          <TabsContent value="json">
            <Card>
              <CardHeader>
                <CardTitle>Filter JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <Code className="max-h-96">
                  {JSON.stringify(filter, null, 2)}
                </Code>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sql">
            <Card>
              <CardHeader>
                <CardTitle>SQL Where Clause</CardTitle>
              </CardHeader>
              <CardContent>
                <Code>{toSqlWhereClause(filter)}</Code>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
