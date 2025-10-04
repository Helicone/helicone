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
  const { file, onFileChange, promptInput: _promptInput } = props;

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
        className="flex h-auto w-fit items-center gap-2 rounded-lg border border-slate-300 px-2 py-1 text-xs text-black dark:border-slate-700 dark:text-white"
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
        <div className="flex h-full w-[400px] flex-col space-y-4">
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-100 px-4 py-8 text-xs hover:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900"
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
          <div className="flex justify-end gap-2 border-t border-slate-300 pt-4">
            <button
              onClick={() => setOpen(false)}
              className="flex flex-row items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:border-slate-700 dark:bg-black dark:text-slate-100 dark:hover:bg-slate-900 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onFileChangeSubmit();
                setOpen(false);
              }}
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
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
