import Footer from "../components/shared/layout/footer";
import NavBarV2 from "../components/shared/layout/navBarV2";
import MetaData from "../components/shared/metaData";

const Sales = () => {
  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="bg-gray-50 antialiased">
        <div className="flex flex-col mx-auto max-w-7xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiasing">
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl text-center">
            <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] pb-1 bg-no-repeat bg-bottom">
              Contact Us
            </span>
          </h1>
          <p className="mt-6 w-full text-xl leading-8 text-gray-700 text-center">
            We would love to hear about your use case and how we can help you.
          </p>
          <div className="mt-16 flex w-full justify-center items-center">
            <form className="border border-gray-300 bg-gray-200 shadow-xl rounded-xl p-8 h-full space-y-4 w-[600px]">
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                >
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    id="first-name"
                    name="first-name"
                    type="text"
                    required
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                >
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    id="last-name"
                    name="last-name"
                    type="text"
                    required
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="company-name"
                  className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                >
                  Company Name
                </label>
                <div className="mt-1">
                  <input
                    id="company-name"
                    name="company-name"
                    type="text"
                    required
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="company-description"
                  className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                >
                  What does your company do and how you plan to use Helicone.
                </label>
                <div className="mt-1">
                  <textarea
                    id="company-description"
                    name="company-description"
                    required
                    rows={4}
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                  />
                </div>
              </div>
              <div className="border-t border-gray-300 flex justify-end gap-2 pt-4">
                <button
                  type="submit"
                  className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </MetaData>
  );
};

export default Sales;
