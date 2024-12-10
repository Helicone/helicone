import { Enclosure } from "rss-parser";

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
  current: boolean;
  featured?: boolean;
  subItems?: NavigationItem[];
}
export interface ChangelogItem {
  title: string;
  description: string;
  link: string;
  content: string;
  "content:encoded": string;
  "content:encodedSnippet": string;
  contentSnippet: string;
  isoDate: string;
  pubDate: string;
  image?: Enclosure;
}
