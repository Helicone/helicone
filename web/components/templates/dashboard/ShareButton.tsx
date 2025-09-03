import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import ThemedModal from "../../shared/themed/themedModal";
import { Input } from "@/components/ui/input";
import { useFilterStore } from "@/filterAST/store/filterStore";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";

export default function ShareButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const filterStore = useFilterStore();
  const filters = filterStore.filter ? toFilterNode(filterStore.filter) : "all";

  async function captureScreenshot(): Promise<string | null> {
    try {
      const el = document.querySelector("section#panels");
      if (!el) return null;
      const html2canvas = (await import("html2canvas" as any)).default as any;
      const canvas = await html2canvas(el as HTMLElement, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      return canvas.toDataURL("image/png");
    } catch (e) {
      return null;
    }
  }

  const onCreate = async () => {
    setCreating(true);
    try {
      const imageDataUrl = await captureScreenshot();
      const body = {
        name: name || null,
        expires_at: expiresAt || null,
        image_base64: imageDataUrl ?? undefined,
        // keep for future: filters,
      } as any;
      const resp = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await resp.json();
      if (resp.ok) {
        const id = json?.data?.id ?? json?.id;
        if (id && typeof window !== "undefined") {
          const origin = window.location.origin;
          setCreatedUrl(`${origin}/share/${id}`);
        } else if (json?.data?.url || json?.url) {
          setCreatedUrl(json?.data?.url ?? json.url);
        }
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm_sleek" onClick={() => setOpen(true)}>
        <Share2 size={14} />
        <span className="ml-2 text-xs">Share</span>
      </Button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex w-full max-w-[480px] flex-col gap-4">
          <h2 className="text-lg font-semibold">Share dashboard</h2>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">Name (optional)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Quarterly report"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">Expires at (optional)</label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          {createdUrl ? (
            <div className="flex items-center justify-between rounded-md border border-border p-2">
              <span className="truncate text-sm">{createdUrl}</span>
              <Button
                size="sm_sleek"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(createdUrl)}
              >
                Copy
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm_sleek" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button size="sm_sleek" onClick={onCreate} disabled={creating}>
                {creating ? "Creating..." : "Create link"}
              </Button>
            </div>
          )}
        </div>
      </ThemedModal>
    </>
  );
}


