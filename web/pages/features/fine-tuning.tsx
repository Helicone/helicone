import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import MetaData from "../../components/layout/public/authMetaData";
import NavBarV2 from "../../components/layout/navbar/navBarV2";
import GridBackground from "../../components/layout/public/gridBackground";
import Link from "next/link";
import ContactForm from "../../components/shared/contactForm";
import Footer from "../../components/layout/footer";

const bullets = [
  "Evaluations",
  "A/B Testing",
  "Automated Fine-Tuning",
  "Dataset Collection",
  "JSONL Exports",
  "Cost Comparisons",
  "Performance Measurements",
  "Drift Analysis",
];

const FineTuning = () => {
  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="h-full min-h-screen bg-white">
        <GridBackground>
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 pb-24 pt-10 antialiased sm:flex-row sm:pb-32 md:px-8 lg:flex lg:py-24">
            <div className="flex w-full flex-col">
              <h1 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-4xl sm:leading-snug">
                Beta:{" "}
                <span className="border-dashed border-rose-500 text-rose-500 md:border-2 md:px-4 md:py-2">
                  Fine-Tuning
                </span>
                <p className="pt-4 text-sm font-normal text-gray-700 sm:text-lg">
                  Reduce your costs and improve your applications performance
                  with our fine-tuning service.
                </p>
              </h1>

              <ul className="flex flex-col space-y-4 py-8">
                {bullets.map((bullet, idx) => (
                  <li
                    className="sm:text-md flex items-center gap-2 text-sm text-gray-700"
                    key={idx}
                  >
                    <CheckCircleIcon className="h-4 w-4 text-rose-500 sm:h-5 sm:w-5" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-sm text-black">
                Want to chat with the founders?
              </p>
              <Link
                href={"https://cal.com/team/helicone/helicone-discoveryl"}
                className="mt-2 flex w-fit flex-row items-center gap-1 text-sm text-gray-500 hover:text-black"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact Us <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <ContactForm
              contactTag={"fine-tuning"}
              buttonText={"Contact Us"}
              defaultPlaceholder={
                "I am interested in Helicone's fine-tuning feature!"
              }
            />
          </div>
        </GridBackground>
      </div>
      <Footer />
    </MetaData>
  );
};

export default FineTuning;
