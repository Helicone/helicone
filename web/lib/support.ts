import { useState } from 'react';
import ThemedModal from '../components/shared/themed/themedModal';

export const openSupportModal = () => {
  const SupportModal = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <ThemedModal open={isOpen} setOpen={setIsOpen}>
        <div className="flex flex-col space-y-4 w-[400px]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Need Help?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Our support team is here to assist you. Please describe your issue below.
          </p>
          <textarea
            className="w-full h-32 p-2 text-sm border rounded-md"
            placeholder="Describe your issue here..."
          ></textarea>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={() => {
              // TODO: Implement support request submission
              console.log('Support request submitted');
              setIsOpen(false);
            }}
          >
            Submit
          </button>
        </div>
      </ThemedModal>
    );
  };

  return SupportModal;
};
