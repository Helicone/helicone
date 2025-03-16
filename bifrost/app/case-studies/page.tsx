import { Customers } from "../customers/page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customer Case Studies | Helicone",
    description:
        "Thousands of companies and developers use Helicone to monitor and optimize their production applications.",
};

export default function CaseStudiesPage() {
    return <Customers />;
} 