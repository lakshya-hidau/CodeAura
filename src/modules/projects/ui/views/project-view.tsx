"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable"
import MessagesContainer from "../compontents/messages-container";
import { Suspense, useState } from "react";
import { Fragment } from "@/generated/prisma/client";

interface Props {
  projectId: string;
}

export const ProjectView = ({ projectId }: Props) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          }>
            <MessagesContainer 
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle/>
        <ResizablePanel
          defaultSize={65}
          minSize={50}
        >
          <div className="p-4 h-full flex flex-col">
            <h2 className="font-semibold text-lg mb-4">Preview</h2>
            {activeFragment ? (
              <div className="flex-1 border rounded-lg p-4 bg-muted/30">
                <div className="mb-4">
                  <h3 className="font-medium text-base mb-2">{activeFragment.title}</h3>
                  <a 
                    href={activeFragment.sandboxUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Open in Sandbox →
                  </a>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Files ({Object.keys(activeFragment.files || {}).length}):</p>
                  <div className="max-h-[60vh] overflow-y-auto space-y-1">
                    {Object.keys(activeFragment.files || {}).map((filePath) => (
                      <div key={filePath} className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        {filePath}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No fragment selected</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectView;