export default function PhNotifHeader() {

  return (
    <div className="bg-sky-500/10 rounded-lg w-full border-l-4 border-l-sky-500 text-sky-500 flex flex-col md:flex-row md:gap-2 gap-4 justify-between md:justify-center md:items-center items-start p-2 mt-2 mx-0 mb-8">
      <h1 className="text-md text-start font-medium tracking-tight">🎉 We&apos;d love your support!{' '}
        <a href="https://www.producthunt.com/new/products/helicone-ai" target="_blank" className="underline decoration-sky-400 decoration-1 underline-offset-2">Get notified</a>{' '}
        about our Product Hunt launch tomorrow.
      </h1>
    </div>
  );
}