import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customer Case Studies | Helicone",
    description:
        "Discover how leading companies are using Helicone to monitor and optimize their AI applications.",
    icons: "/static/logo.webp",
    openGraph: {
        type: "website",
        siteName: "Helicone.ai",
        url: "https://www.helicone.ai/case-studies",
        title: "Customer Case Studies | Helicone",
        description:
            "Discover how leading companies are using Helicone to monitor and optimize their AI applications.",
        images: "/static/new-open-graph.png",
        locale: "en_US",
    },
    twitter: {
        title: "Customer Case Studies | Helicone",
        description:
            "Discover how leading companies are using Helicone to monitor and optimize their AI applications.",
        card: "summary_large_image",
        images: "/static/new-open-graph.png",
    },
};

export default function CaseStudiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full bg-white min-h-screen antialiased relative text-black">
            {children}
        </div>
    );
} 