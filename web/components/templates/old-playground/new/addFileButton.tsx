import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import ThemedModal from "../../../shared/themed/themedModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface AddFileButtonProps {
  file: File | string | null;
  onFileChange: (file: File | string | null) => void;
  promptInput?: boolean;
}

const AddFileButton = (props: AddFileButtonProps) => {
  const { file, onFileChange, promptInput } = props;

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
      <Button
        variant="outline"
        onClick={() => {
          setOpen(!open);
        }}
        className="w-fit text-black dark:text-white border border-slate-300 dark:border-slate-700 px-2 py-1 h-auto rounded-lg text-xs flex items-center gap-2"
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
      </Button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[400px] h-full flex flex-col space-y-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            Chat Image
          </h2>
          <p className="text-sm text-slate-500">
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
            className="hover:cursor-not-allowed bg-slate-100 dark:bg-slate-900 w-full border border-dashed border-slate-300 dark:border-slate-700 px-4 py-8 rounded-lg text-xs flex items-center justify-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Upload from Computer
          </button>
          <Separator>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              or
            </span>
          </Separator>
          <Input
            placeholder="http://exampleurl.com"
            onChange={(e) => {
              setCurrentFile(e.target.value);
            }}
          />

          {/* 
          TODO this will be needed for prompt inputs
          <Divider className="">or</Divider>
          <ThemedTextDropDown
            options={["Image-1", "Image-2", "Image-3", "Image-4", "Image-5"]}
            value="Image-2"
            onChange={(key) => {
              setCurrentFile(`<helicone-prompt-input key="${key}" />`);
            }}
          /> */}
          <div className="border-t border-slate-300 flex justify-end gap-2 pt-4">
            <button
              onClick={() => setOpen(false)}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm hover:text-slate-700 dark:hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onFileChangeSubmit();
                setOpen(false);
              }}
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
