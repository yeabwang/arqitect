"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PathBlankProps {
  name: string;
  roomId: string;
  nameValid: boolean;
  isLoading: boolean;
  /** Project-creation error surfaced by the parent flow. */
  createError?: string | null;
  onNameChange: (value: string) => void;
  onCreate: () => void;
}

export function PathBlank({
  name,
  roomId,
  nameValid,
  isLoading,
  createError,
  onNameChange,
  onCreate,
}: PathBlankProps) {
  const canCreate = nameValid && !isLoading;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-12">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border-default bg-bg-surface p-8">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.18em] text-text-muted uppercase">
            Blank canvas
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Name your design
          </h1>
          <p className="text-sm leading-relaxed text-text-secondary">
            Open an empty system canvas under this name. Add components, draw
            connections, and bring in Arqitect whenever you want a hand.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            id="design-name"
            autoFocus
            aria-label="Design name"
            placeholder="e.g. Billing service"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canCreate) {
                event.preventDefault();
                onCreate();
              }
            }}
          />
          {roomId ? (
            <p className="text-xs text-text-muted">
              Room ID:{" "}
              <span className="font-mono text-text-secondary">{roomId}</span>
            </p>
          ) : null}
        </div>

        {createError ? (
          <p className="text-xs text-state-error">{createError}</p>
        ) : null}

        <Button className="w-full" disabled={!canCreate} onClick={onCreate}>
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
