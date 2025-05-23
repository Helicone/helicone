import dynamic from "next/dynamic";

const StaticShell = dynamic(() => import("@/components/static-shell"), {
  ssr: false,
});

export default StaticShell;
