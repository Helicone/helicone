import { useRouter } from "next/router";
import useNotification from "./notification/useNotification";
import { useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export type ContactFormData = {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyDescription: string;
  tag: string;
};

interface ContactFormProps {
  contactTag: string;
  buttonText: string;
  defaultPlaceholder?: string;
}

const ContactForm = (props: ContactFormProps) => {
  const { contactTag, buttonText, defaultPlaceholder } = props;

  const router = useRouter();
  const { setNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);

  const formSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (contactTag === "mfs" && !showCoupon) {
      setShowCoupon(true);
      return;
    }

    setIsLoading(true);
    const firstName = event.currentTarget.elements.namedItem(
      "first-name"
    ) as HTMLInputElement;
    const lastName = event.currentTarget.elements.namedItem(
      "last-name"
    ) as HTMLInputElement;
    const email = event.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;
    const companyName = event.currentTarget.elements.namedItem(
      "company-name"
    ) as HTMLInputElement;
    const companyDescription = event.currentTarget.elements.namedItem(
      "company-description"
    ) as HTMLInputElement;

    fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        companyName: companyName.value,
        companyDescription: companyDescription.value,
        tag: contactTag,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setNotification(
            "Error submitting form. Please try again later.",
            "error"
          );
        } else {
          // if the contact tag is mfs, take them to the sign up page
          if (contactTag === "mfs") {
            setTimeout(() => {
              // Set the MFS local storage
              localStorage.setItem("mfs-email", email.value);
              setNotification("Form submitted successfully!", "success");
              setIsLoading(false);
              router.push("/signup");
            }, 1500);
          } else {
            const formElement = event.target as HTMLFormElement;
            formElement.reset();
            setIsLoading(false);
            setNotification("Form submitted successfully!", "success");
          }
        }
      });
  };

  return (
    <form
      action="#"
      method="POST"
      onSubmit={formSubmitHandler}
      className="border-2 border-gray-300 bg-sky-100 rounded-xl p-8 h-full space-y-4 w-full mt-16 lg:mt-0"
    >
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
            className="bg-sky-50 block w-full rounded-md border border-gray-300 py-1.5 shadow-sm  text-sm lg:text-md lg:leading-6"
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
            className="bg-sky-50 block w-full rounded-md border border-gray-300 py-1.5 shadow-sm  text-sm lg:text-md lg:leading-6"
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
            className="bg-sky-50 block w-full rounded-md border border-gray-300 py-1.5 shadow-sm  text-sm lg:text-md lg:leading-6"
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
            className="bg-sky-50 block w-full rounded-md border border-gray-300 py-1.5 shadow-sm  text-sm lg:text-md lg:leading-6"
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
            placeholder={defaultPlaceholder}
            className="bg-sky-50 block w-full rounded-md border border-gray-300 py-1.5 shadow-sm  text-sm lg:text-md lg:leading-6"
          />
        </div>
      </div>
      <div className="border-t border-gray-300 flex items-center justify-end gap-2 pt-4">
        {showCoupon ? (
          <p>
            Use coupon code: <span className="font-semibold">MSFTHELI</span>
          </p>
        ) : (
          <div />
        )}
        <Link
          href="https://cal.com/team/helicone/helicone-discovery"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-sky-100 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Schedule a call
        </Link>
        <button
          type="submit"
          className="bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          {isLoading && (
            <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
          )}
          {contactTag === "mfs"
            ? showCoupon
              ? "Get Started"
              : buttonText
            : buttonText}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
