import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoadingCard() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Loading comparison data...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse">
          <div className="mb-4 h-4 rounded bg-gray-200"></div>
          <div className="mb-4 h-4 rounded bg-gray-200"></div>
          <div className="h-4 rounded bg-gray-200"></div>
        </div>
      </CardContent>
    </Card>
  );
}
