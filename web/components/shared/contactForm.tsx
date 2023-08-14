import useNotification from "./notification/useNotification";

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
}

const ContactForm = (props: ContactFormProps) => {
  const { contactTag, buttonText } = props;

  const { setNotification } = useNotification();

  const formSubmitHandler = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          setNotification("Form submitted successfully!", "success");
          const formElement = event.target as HTMLFormElement;
          formElement.reset();
        }
      });
  };

  return (
    <form
      action="#"
      method="POST"
      onSubmit={formSubmitHandler}
      className="border border-gray-300 bg-gray-200 shadow-xl rounded-xl p-8 h-full space-y-4 w-[600px] mt-16 lg:mt-0"
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
          {buttonText}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
