"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PathBlankProps {
  nameValid: boolean;
  isLoading: boolean;
  onCreate: () => void;
}

export function PathBlank({ nameValid, isLoading, onCreate }: PathBlankProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-secondary">
        We&rsquo;ll open an empty canvas under your design name. Add components,
        draw connections, and bring in Arqitect whenever you want a hand.
      </p>
      <div>
        <Button onClick={onCreate} disabled={!nameValid || isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Create design
        </Button>
      </div>
    </div>
  );
}
