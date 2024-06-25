import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/assets/logo.svg"
      height={35}
      width={35}
      alt="Helicone logo - AI developers' LLM observability and monitoring platform"
    />
  );
}
