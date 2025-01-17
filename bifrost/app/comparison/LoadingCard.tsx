import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoadingCard() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Loading comparison data...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}
