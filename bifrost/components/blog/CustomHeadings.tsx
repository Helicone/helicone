import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link2 } from "lucide-react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  id?: string;
}

const Heading: React.FC<HeadingProps> = ({
  as: Tag,
  id,
  children,
  className = "",
  ...props
}) => {

  const handleCopy = (e: React.MouseEvent) => {
    if (!id) return;
    const url = window.location.origin + window.location.pathname + `#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied!");
    });
  };

  return (
    <>
      <Tag
        id={id}
        {...props}
        className={`group relative flex items-center ${className}`}
      >
        <a
          href={`#${id}`}
          className="flex items-center no-underline transition-colors duration-300 hover:text-sky-500 cursor-pointer"
        >
          <span>{children}</span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleCopy(e);
            }}
            className="ml-2 inline-flex items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <Link2 size={16} className="text-gray-400 hover:text-gray-600" />
          </span>
        </a>
      </Tag>
      {/* You can also render the Toaster globally instead */}
      <Toaster />
    </>
  );
};

export const H1 = (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h1" {...props} />;
export const H2 = (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h2" {...props} />;
export const H3 = (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h3" {...props} />;
export const H4 = (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h4" {...props} />;
export const H5 = (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h5" {...props} />;
export const H6 = (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h6" {...props} />;

export default {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
};