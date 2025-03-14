import { Customers } from "../community/customers";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customer Case Studies | Helicone",
    description:
        "Discover how leading companies are using Helicone to monitor and optimize their AI applications.",
};

export default function CaseStudiesPage() {
    return <Customers />;
} 