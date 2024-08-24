import { Row } from "@/components/common/row";

export default function PhNotifHeader() {

  return (
    <Row className="bg-sky-500/10 rounded-lg w-full border-l-4 border-l-sky-500 text-sky-500 md:gap-2 gap-4 justify-between md:justify-center md:items-center items-start p-4 mt-4 mx-0 mb-8">
      <h1 className="text-md text-start md:text-center font-medium tracking-tight">🎉 We&apos;d love your support!{' '}
        <a href="https://www.producthunt.com/new/products/helicone-ai" target="_blank" className="underline decoration-sky-400 decoration-1 underline-offset-2 hover:text-sky-600 transition-colors duration-200">Get notified</a>{' '}
        about our Product Hunt launch tomorrow.
      </h1>
    </Row>
  );
}