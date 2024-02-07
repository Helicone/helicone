import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
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
  const router = useRouter();

  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="bg-white h-full min-h-screen">
        <GridBackground>
          <div className="flex flex-col sm:flex-row mx-auto w-full gap-8 max-w-5xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
            <div className="flex flex-col w-full">
              <h1 className="text-2xl sm:text-4xl font-semibold leading-tight sm:leading-snug max-w-4xl">
                Beta:{" "}
                <span className="md:border-2 border-rose-500 border-dashed text-rose-500 md:py-2 md:px-4">
                  Fine-Tuning
                </span>
                <p className="text-sm sm:text-lg font-normal text-gray-700 pt-4">
                  Reduce your costs and improve your applications performance
                  with our fine-tuning service.
                </p>
              </h1>

              <ul className="py-8 flex flex-col space-y-4">
                {bullets.map((bullet, idx) => (
                  <li
                    className="flex items-center text-gray-700 gap-2 text-sm sm:text-md"
                    key={idx}
                  >
                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                    {bullet}
                  </li>
                ))}
              </ul>

              <p className="text-black text-sm mt-4">
                Want to chat with the founders?
              </p>
              <Link
                href={"https://cal.com/team/helicone/helicone-discoveryl"}
                className="text-gray-500 hover:text-black flex flex-row items-center gap-1 text-sm mt-2 w-fit"
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
