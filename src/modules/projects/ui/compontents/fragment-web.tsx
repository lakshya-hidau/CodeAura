import { Button } from "@/components/ui/button";
import { Fragment } from "@/generated/prisma/client";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";
import { useState } from "react";
import { Hint } from "./hints";

interface Props {
  data: Fragment;
}

export function FragmentWeb({ data }: Props) {
  const [copied, setCopied] = useState(false);
  const [fragmentKey, setFragmentKey] = useState(0);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    if (!data?.sandboxUrl) return;
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">

        <Hint text="Refresh Page" side="bottom">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon className="h-4 w-4" />
          </Button>
        </Hint>

        <Hint text="Copy link" side="bottom">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={!data?.sandboxUrl || copied}
            className="flex-1 justify-start text-start font-normal"
          >
            <span className="truncate">
              {data?.sandboxUrl || "No sandbox URL"}
            </span>
          </Button>
        </Hint>

        <Hint text="Open in New Tab" side="bottom" align="start">
          <Button
            size="sm"
            variant="outline"
            disabled={!data?.sandboxUrl}
            onClick={() => {
              if (!data?.sandboxUrl) return;
              window.open(data.sandboxUrl, "_blank");
            }}
          >
            <ExternalLinkIcon className="h-4 w-4" />
          </Button>
        </Hint>
      </div>

      {data?.sandboxUrl ? (
        <iframe
          key={fragmentKey}
          className="h-full w-full"
          sandbox="allow-forms allow-scripts allow-same-origin"
          loading="lazy"
          src={data.sandboxUrl}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No preview available
        </div>
      )}
    </div>
  );
}
