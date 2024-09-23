import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlanFeatureCardProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick?: () => void;
}

export const PlanFeatureCard: React.FC<PlanFeatureCardProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="whitespace-nowrap">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button variant="outline" onClick={onButtonClick}>
        {buttonText}
      </Button>
    </CardContent>
  </Card>
);
