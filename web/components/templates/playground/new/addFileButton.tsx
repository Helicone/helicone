import { PencilIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, useRef, useState } from "react";
import ThemedModal from "../../../shared/themed/themedModal";

interface AddFileButtonProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const AddFileButton = (props: AddFileButtonProps) => {
  const { file, onFileChange } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      onFileChange(file);
      //   setFile(file);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      <button
        onClick={() => {
          setOpen(!open);
        }}
        className="w-fit border border-gray-300 dark:border-gray-700 px-2 py-1 rounded-lg text-xs flex items-center gap-2"
      >
        <PlusIcon className="h-4 w-4" />
        Add Image
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[400px] h-full flex flex-col space-y-4">
          <h2 className="text-2xl font-semibold text-black dark:text-white">
            Message Image
          </h2>
        </div>
      </ThemedModal>
      {file ? (
        <div className="flex flex-col space-y-2 relative">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            width={256}
            height={256}
          />
          <button
            onClick={() => {
              onFileChange(null);
            }}
            className="absolute -top-4 -right-2"
          >
            <XMarkIcon className="h-4 w-4 text-white bg-red-500 rounded-full p-0.5" />
          </button>

          <button
            onClick={handleClick}
            className="w-fit border border-gray-300 dark:border-gray-700 px-2 py-1 rounded-lg text-xs flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Change Image
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className="w-fit border border-gray-300 dark:border-gray-700 px-2 py-1 rounded-lg text-xs flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Image
        </button>
      )}
    </div>
  );
};

export default AddFileButton;
