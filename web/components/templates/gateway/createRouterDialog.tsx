import MarkdownEditor from "@/components/shared/markdownEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import yaml from "js-yaml";
import useNotification from "@/components/shared/notification/useNotification";

const defaultConfig = `load-balance:
  chat:
    strategy: model-latency
    models:
      - openai/gpt-4o-mini
      - anthropic/claude-3-5-sonnet`;

const CreateRouterDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [name, setName] = useState("");
  const [config, setConfig] = useState(defaultConfig);
  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const { mutate: createRouter } = $JAWN_API.useMutation(
    "post",
    "/v1/gateway",
    {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["get", "/v1/gateway"] });
        setNotification("Router created", "success");
      },
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4" />
          Create Router
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Router</DialogTitle>
          <DialogDescription>Create a new router</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <MarkdownEditor
          monaco
          text={config}
          setText={(value) => setConfig(value)}
          disabled={false}
          language="yaml"
          monacoOptions={{
            lineNumbers: "on",
          }}
        />
        <DialogFooter>
          <Button
            onClick={() => {
              if (!name || !config) {
                return;
              }
              const obj = yaml.load(config);
              createRouter({
                body: {
                  name,
                  config: JSON.stringify(obj),
                },
              });
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRouterDialog;
