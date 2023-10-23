/* eslint-disable @next/next/no-img-element */

import Image from "next/image";

export default function Logos() {
  return (
    <div className="pt-24 sm:pt-36">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto w-full lg:max-w-none">
          <div className="mx-auto mt-10 flex flex-wrap gap-8">
            <Image
              className="max-h-12 object-contain object-left"
              src="https://tailwindui.com/img/logos/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <Image
              className="max-h-12 object-contain object-left"
              src="https://tailwindui.com/img/logos/reform-logo-gray-900.svg"
              alt="Reform"
              width={158}
              height={48}
            />
            <Image
              className="max-h-12 object-contain object-left"
              src="https://tailwindui.com/img/logos/tuple-logo-gray-900.svg"
              alt="Tuple"
              width={158}
              height={48}
            />
            <Image
              className="max-h-12 object-contain object-left"
              src="https://tailwindui.com/img/logos/savvycal-logo-gray-900.svg"
              alt="SavvyCal"
              width={158}
              height={48}
            />
            <Image
              className="max-h-12 object-contain object-left"
              src="https://tailwindui.com/img/logos/statamic-logo-gray-900.svg"
              alt="Statamic"
              width={158}
              height={48}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
