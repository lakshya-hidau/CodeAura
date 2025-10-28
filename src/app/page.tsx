'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export default function Page() {
  const [value, setValue] = useState("");
  const trpc = useTRPC();
  const { data: message } = useQuery(trpc.message.getMany.queryOptions());
  const createMessage = useMutation(trpc.message.create.mutationOptions({
    onSuccess: () => {
      toast.success("Message created successfully");
    }
  }));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)}/>
      <Button onClick={() => { createMessage.mutate({ value: value }) }}>
        Invoke Background Job
      </Button>
      {JSON.stringify(message, null, 2)}
    </div>
  );
}