import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import ThemedModal from "../../../shared/themed/themedModal";
import { Divider, TextInput } from "@tremor/react";

interface AddFileButtonProps {
  file: File | string | null;
  onFileChange: (file: File | string | null) => void;
}

const AddFileButton = (props: AddFileButtonProps) => {
  const { file, onFileChange } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | string | null>(file);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileChangeSubmit = () => {
    // file handler
    if (currentFile instanceof File) {
      onFileChange(currentFile);
    }
    // url handler
    else if (currentFile) {
      onFileChange(currentFile);
    } else {
      onFileChange(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setOpen(!open);
        }}
        className="w-fit text-black dark:text-white border border-gray-300 dark:border-gray-700 px-2 py-1 rounded-lg text-xs flex items-center gap-2"
      >
        {file ? (
          <>
            <PencilIcon className="h-4 w-4" />
            Edit Image
          </>
        ) : (
          <>
            <PlusIcon className="h-4 w-4" />
            Add Image
          </>
        )}
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[400px] h-full flex flex-col space-y-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Chat Image
          </h2>
          <p className="text-sm text-gray-500">
            Upload an image or enter in an image URL.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              setCurrentFile(e.target.files ? e.target.files[0] : null);
            }}
            accept="image/*"
            style={{ display: "none" }}
          />
          <button
            disabled={true}
            onClick={handleClick}
            className="hover:cursor-not-allowed bg-gray-100 dark:bg-gray-900 w-full border border-dashed border-gray-300 dark:border-gray-700 px-4 py-8 rounded-lg text-xs flex items-center justify-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Upload from Computer
          </button>
          <Divider className="">or</Divider>
          <TextInput
            placeholder={"http://exampleurl.com"}
            onChange={(e) => {
              setCurrentFile(e.target.value);
            }}
          />

          <div className="border-t border-gray-300 flex justify-end gap-2 pt-4">
            <button
              onClick={() => setOpen(false)}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onFileChangeSubmit();
                setOpen(false);
              }}
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {file ? "Change Image" : "Add Image"}
            </button>
          </div>
        </div>
      </ThemedModal>
    </div>
  );
};

export default AddFileButton;
