"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { useUser } from "@clerk/nextjs";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  Bot,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AI_ASSISTANT_SENDER_ID,
  AI_ASSISTANT_SENDER_NAME,
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  isActiveAiStatusPhase,
  parseAiChatMessagePayload,
  parseAiStatusFeedPayload,
  type AiChatMessagePayload,
  type AiStatusFeedPayload,
} from "@/types/tasks";
import type { designAgentTask } from "@/trigger/design-agent";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const USER_BUBBLE_BG = "#62C073";
const USER_BUBBLE_TEXT = "#0b1115";
const SUBMIT_BUTTON_BG = "#62C073";
const STATUS_ACCENT = "#62C073";

const FAILED_RUN_STATUSES = new Set<string>([
  "FAILED",
  "CRASHED",
  "CANCELED",
  "TIMED_OUT",
  "SYSTEM_FAILURE",
  "EXPIRED",
]);

interface LatestStatus {
  payload: AiStatusFeedPayload;
  createdAt: number;
  messageId: string;
}

function useLatestAiStatus(): LatestStatus | null {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);

  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return null;
    }
    let latest: LatestStatus | null = null;
    for (const message of messages) {
      const payload = parseAiStatusFeedPayload(message.data);
      if (!payload) {
        continue;
      }
      if (!latest || message.createdAt > latest.createdAt) {
        latest = {
          payload,
          createdAt: message.createdAt,
          messageId: message.id,
        };
      }
    }
    return latest;
  }, [messages]);
}

interface ChatFeedItem {
  id: string;
  createdAt: number;
  payload: AiChatMessagePayload;
}

function useAiChatMessages(): ChatFeedItem[] {
  const { messages } = useFeedMessages(AI_CHAT_FEED_ID);
  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const valid: ChatFeedItem[] = [];
    for (const message of messages) {
      const payload = parseAiChatMessagePayload(message.data);
      if (!payload) {
        continue;
      }
      valid.push({
        id: message.id,
        createdAt: message.createdAt,
        payload,
      });
    }
    valid.sort((a, b) => a.createdAt - b.createdAt);
    return valid;
  }, [messages]);
}

interface ActiveRun {
  runId: string;
  publicToken: string;
}

export function AiSidebar({
  isOpen,
  onClose,
  projectId,
  roomId,
}: AiSidebarProps) {
  const [tab, setTab] = useState<"architect" | "chat" | "specs">("architect");

  return (
    <aside
      className={cn(
        "absolute top-0 right-0 z-30 hidden h-full w-96 flex-col border-l border-border-default bg-bg-base/95 shadow-2xl backdrop-blur-md transition-transform duration-200 md:flex",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
      )}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border-default px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-accent-ai-text">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-text-primary">
              AI Workspace
            </h2>
            <p className="text-xs text-text-muted">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          setTab(value as "architect" | "chat" | "specs")
        }
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <TabsList className="mx-4 mt-3 grid h-9 w-auto grid-cols-3 bg-bg-elevated">
          <TabsTrigger
            value="architect"
            className="text-text-muted data-active:bg-accent-primary-dim data-active:text-accent-primary"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-text-muted data-active:bg-accent-primary-dim data-active:text-accent-primary"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="text-text-muted data-active:bg-accent-primary-dim data-active:text-accent-primary"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="architect"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <ArchitectTab projectId={projectId} roomId={roomId} />
        </TabsContent>

        <TabsContent
          value="chat"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <ChatTab />
        </TabsContent>

        <TabsContent
          value="specs"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
        >
          <Button
            type="button"
            className="w-full bg-accent-primary text-white hover:bg-accent-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Generate Spec
          </Button>

          <SpecCard />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

interface ArchitectTabProps {
  projectId: string;
  roomId: string;
}

function ArchitectTab({ projectId, roomId }: ArchitectTabProps) {
  const { user } = useUser();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const chatItems = useAiChatMessages();
  const latestStatus = useLatestAiStatus();
  const updateMyPresence = useUpdateMyPresence();

  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ensureFeedRef = useRef<Promise<void> | null>(null);

  const ensureFeed = useCallback(() => {
    if (ensureFeedRef.current) {
      return ensureFeedRef.current;
    }
    const promise = createFeed(AI_CHAT_FEED_ID).catch(() => {
      // already-exists / race conditions are non-fatal.
    });
    ensureFeedRef.current = promise;
    return promise;
  }, [createFeed]);

  useEffect(() => {
    void ensureFeed();
  }, [ensureFeed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatItems.length, latestStatus?.messageId]);

  const isRunActive = activeRun !== null;

  useEffect(() => {
    updateMyPresence({ thinking: isRunActive });
  }, [isRunActive, updateMyPresence]);

  const currentUserId = user?.id ?? null;
  const currentUserName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Anonymous";
  const currentUserAvatar = user?.imageUrl || undefined;

  const pushChatMessage = useCallback(
    async (payload: AiChatMessagePayload) => {
      await ensureFeed();
      await createFeedMessage(AI_CHAT_FEED_ID, payload);
    },
    [createFeedMessage, ensureFeed],
  );

  const pushAssistantMessage = useCallback(
    async (content: string, runId: string, isError = false) => {
      const payload: AiChatMessagePayload = {
        kind: "chat",
        role: "assistant",
        senderId: AI_ASSISTANT_SENDER_ID,
        senderName: AI_ASSISTANT_SENDER_NAME,
        content,
        timestamp: Date.now(),
        runId,
        ...(isError ? { isError: true } : {}),
      };
      try {
        await pushChatMessage(payload);
      } catch {
        // swallow — surfacing as toast would just create a second failure path.
      }
    },
    [pushChatMessage],
  );

  const submitDraft = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (
        trimmed.length === 0 ||
        isSubmitting ||
        isRunActive ||
        !currentUserId
      ) {
        return;
      }
      setIsSubmitting(true);
      setDraft("");
      try {
        await pushChatMessage({
          kind: "chat",
          role: "user",
          senderId: currentUserId,
          senderName: currentUserName,
          ...(currentUserAvatar ? { senderAvatarUrl: currentUserAvatar } : {}),
          content: trimmed,
          timestamp: Date.now(),
        });
      } catch {
        // swallow chat-push errors and continue to AI trigger.
      }

      try {
        const response = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            projectId,
            roomId,
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          await pushAssistantMessage(
            text || "Failed to start Ghost AI. Please try again.",
            "no-run",
            true,
          );
          return;
        }
        const data = (await response.json()) as {
          runId?: string;
          publicToken?: string;
        };
        if (
          typeof data.runId === "string" &&
          data.runId.length > 0 &&
          typeof data.publicToken === "string" &&
          data.publicToken.length > 0
        ) {
          setActiveRun({ runId: data.runId, publicToken: data.publicToken });
        } else {
          await pushAssistantMessage(
            "Ghost AI did not return a run handle.",
            "no-run",
            true,
          );
        }
      } catch {
        await pushAssistantMessage(
          "Network error reaching Ghost AI. Please try again.",
          "no-run",
          true,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentUserAvatar,
      currentUserId,
      currentUserName,
      isRunActive,
      isSubmitting,
      projectId,
      pushAssistantMessage,
      pushChatMessage,
      roomId,
    ],
  );

  const handleRunCompleted = useCallback(
    async (runId: string, summary: string) => {
      await pushAssistantMessage(summary, runId, false);
      setActiveRun((current) =>
        current && current.runId === runId ? null : current,
      );
    },
    [pushAssistantMessage],
  );

  const handleRunFailed = useCallback(
    async (runId: string, message: string) => {
      await pushAssistantMessage(message, runId, true);
      setActiveRun((current) =>
        current && current.runId === runId ? null : current,
      );
    },
    [pushAssistantMessage],
  );

  const handleSend = useCallback(() => {
    void submitDraft(draft);
  }, [draft, submitDraft]);

  const handleStarterClick = useCallback(
    (prompt: string) => {
      void submitDraft(prompt);
    },
    [submitDraft],
  );

  const handleTextareaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value);
    },
    [],
  );

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void submitDraft(draft);
      }
    },
    [draft, submitDraft],
  );

  const inputsDisabled = isSubmitting || isRunActive || !currentUserId;
  const hasAnyChat = chatItems.length > 0;

  const statusForStrip =
    isRunActive &&
    latestStatus &&
    latestStatus.payload.runId === activeRun?.runId
      ? latestStatus.payload
      : null;

  return (
    <>
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        {!hasAnyChat ? (
          <ArchitectEmptyState
            onStarterClick={handleStarterClick}
            disabled={inputsDisabled}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {chatItems.map((item) => (
              <ArchitectMessageBubble
                key={item.id}
                payload={item.payload}
                isCurrentUser={
                  item.payload.role === "user" &&
                  currentUserId !== null &&
                  item.payload.senderId === currentUserId
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-default px-4 py-3">
        {statusForStrip ? <StatusStrip payload={statusForStrip} /> : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder={
              isRunActive
                ? "Ghost AI is working on your last request..."
                : "Ask Ghost AI to design something..."
            }
            className="min-h-[72px] max-h-[160px] resize-none bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted"
            disabled={inputsDisabled}
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={draft.trim().length === 0 || inputsDisabled}
            aria-label={inputsDisabled ? "Ghost AI is busy" : "Send message"}
            className="text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: SUBMIT_BUTTON_BG }}
          >
            {isSubmitting || isRunActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-text-faint">
          Enter to send. Shift + Enter for a new line.
        </p>
      </div>

      {activeRun ? (
        <RunTracker
          key={activeRun.runId}
          runId={activeRun.runId}
          publicToken={activeRun.publicToken}
          onCompleted={handleRunCompleted}
          onFailed={handleRunFailed}
        />
      ) : null}
    </>
  );
}

interface RunTrackerProps {
  runId: string;
  publicToken: string;
  onCompleted: (runId: string, summary: string) => void | Promise<void>;
  onFailed: (runId: string, message: string) => void | Promise<void>;
}

function RunTracker({
  runId,
  publicToken,
  onCompleted,
  onFailed,
}: RunTrackerProps) {
  const { run, error } = useRealtimeRun<typeof designAgentTask>(runId, {
    accessToken: publicToken,
  });
  const settledRef = useRef(false);

  useEffect(() => {
    if (settledRef.current) {
      return;
    }
    if (error) {
      settledRef.current = true;
      void onFailed(
        runId,
        error.message || "Lost connection to Ghost AI. Please try again.",
      );
      return;
    }
    if (!run) {
      return;
    }
    if (run.status === "COMPLETED") {
      settledRef.current = true;
      const summary =
        (run.output && typeof run.output.summary === "string"
          ? run.output.summary.trim()
          : "") ||
        `Ghost AI applied ${run.output?.applied ?? 0} change${
          (run.output?.applied ?? 0) === 1 ? "" : "s"
        }.`;
      void onCompleted(runId, summary);
      return;
    }
    if (FAILED_RUN_STATUSES.has(run.status)) {
      settledRef.current = true;
      void onFailed(
        runId,
        run.error?.message || "Ghost AI hit an error while designing.",
      );
    }
  }, [error, onCompleted, onFailed, run, runId]);

  return null;
}

function StatusStrip({ payload }: { payload: AiStatusFeedPayload }) {
  const text =
    payload.text && payload.text.trim().length > 0
      ? payload.text
      : defaultStatusText(payload);
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-2 flex items-center gap-2 rounded-md border border-border-default bg-bg-elevated px-2.5 py-1.5 text-xs text-text-primary"
    >
      <span
        className="inline-flex h-2 w-2 shrink-0 animate-pulse rounded-full"
        style={{ backgroundColor: STATUS_ACCENT }}
        aria-hidden
      />
      <Loader2
        className="h-3 w-3 shrink-0 animate-spin"
        style={{ color: STATUS_ACCENT }}
        aria-hidden
      />
      <span className="truncate">{text}</span>
    </div>
  );
}

interface ArchitectMessageBubbleProps {
  payload: AiChatMessagePayload;
  isCurrentUser: boolean;
}

function ArchitectMessageBubble({
  payload,
  isCurrentUser,
}: ArchitectMessageBubbleProps) {
  if (payload.role === "assistant") {
    const isError = payload.isError === true;
    return (
      <div className="flex justify-start">
        <div
          className={cn(
            "flex max-w-[85%] items-start gap-2 rounded-2xl border px-3 py-2 text-sm",
            isError
              ? "border-state-error/40 bg-state-error/10 text-state-error"
              : "border-border-default bg-bg-elevated text-text-primary",
          )}
        >
          {isError ? (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Bot
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: STATUS_ACCENT }}
            />
          )}
          <span className="whitespace-pre-wrap break-words">
            {payload.content}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}>
      <div
        className="max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words"
        style={{ backgroundColor: USER_BUBBLE_BG, color: USER_BUBBLE_TEXT }}
      >
        {!isCurrentUser ? (
          <div
            className="mb-1 text-[10px] font-semibold opacity-70"
            style={{ color: USER_BUBBLE_TEXT }}
          >
            {payload.senderName}
          </div>
        ) : null}
        {payload.content}
      </div>
    </div>
  );
}

interface ArchitectEmptyStateProps {
  onStarterClick: (prompt: string) => void;
  disabled: boolean;
}

function ArchitectEmptyState({
  onStarterClick,
  disabled,
}: ArchitectEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated text-accent-ai-text">
        <Bot className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">
          Start designing with Ghost AI
        </p>
        <p className="max-w-64 text-xs text-text-muted">
          Describe what you want to build and Ghost AI will sketch an
          architecture on the canvas.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onStarterClick(prompt)}
            disabled={disabled}
            className="w-full rounded-full bg-bg-subtle px-3 py-1.5 text-xs text-accent-ai-text transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function defaultStatusText(payload: AiStatusFeedPayload): string {
  switch (payload.phase) {
    case "starting":
      return "Ghost AI is starting...";
    case "thinking":
      return "Ghost AI is thinking...";
    case "applying":
      return "Ghost AI is applying changes...";
    case "complete":
      return "Ghost AI finished.";
    case "error":
      return "Ghost AI hit an error.";
  }
}

function ChatTab() {
  const { user } = useUser();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const chatItems = useAiChatMessages();

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ensureFeedRef = useRef<Promise<void> | null>(null);

  const ensureFeed = useCallback(() => {
    if (ensureFeedRef.current) {
      return ensureFeedRef.current;
    }
    const promise = createFeed(AI_CHAT_FEED_ID).catch(() => {
      // already-exists / race conditions are non-fatal.
    });
    ensureFeedRef.current = promise;
    return promise;
  }, [createFeed]);

  useEffect(() => {
    void ensureFeed();
  }, [ensureFeed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatItems.length]);

  const currentUserId = user?.id ?? null;
  const currentUserName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress ||
    "Anonymous";
  const currentUserAvatar = user?.imageUrl || undefined;

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || isSending || !currentUserId) {
      return;
    }
    setIsSending(true);
    setErrorText(null);
    try {
      await ensureFeed();
      const payload: AiChatMessagePayload = {
        kind: "chat",
        role: "user",
        senderId: currentUserId,
        senderName: currentUserName,
        ...(currentUserAvatar ? { senderAvatarUrl: currentUserAvatar } : {}),
        content: trimmed,
        timestamp: Date.now(),
      };
      await createFeedMessage(AI_CHAT_FEED_ID, payload);
      setDraft("");
    } catch {
      setErrorText("Couldn't send message. Try again.");
    } finally {
      setIsSending(false);
    }
  }, [
    createFeedMessage,
    currentUserAvatar,
    currentUserId,
    currentUserName,
    draft,
    ensureFeed,
    isSending,
  ]);

  const handleTextareaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value);
      if (errorText) {
        setErrorText(null);
      }
    },
    [errorText],
  );

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const disabled = isSending || !currentUserId;

  return (
    <>
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
      >
        {chatItems.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {chatItems.map((item) => (
              <ChatMessageBubble
                key={item.id}
                payload={item.payload}
                isOwnMessage={
                  currentUserId !== null &&
                  item.payload.role === "user" &&
                  item.payload.senderId === currentUserId
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-default px-4 py-3">
        {errorText ? (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-state-error/40 bg-state-error/10 px-2 py-1 text-xs text-state-error">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            <span>{errorText}</span>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Message your team..."
            className="min-h-[72px] max-h-[160px] resize-none bg-bg-elevated text-sm text-text-primary placeholder:text-text-muted"
            disabled={disabled}
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void handleSend()}
            disabled={draft.trim().length === 0 || disabled}
            aria-label={isSending ? "Sending message" : "Send message"}
            className="bg-accent-primary text-white hover:bg-accent-primary/90"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-text-faint">
          Enter to send. Shift + Enter for a new line.
        </p>
      </div>
    </>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-border-default bg-bg-elevated text-accent-ai-text">
        <MessageSquare className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-text-primary">
          No messages yet
        </p>
        <p className="max-w-64 text-xs text-text-muted">
          Start the conversation with collaborators in this room.
        </p>
      </div>
    </div>
  );
}

interface ChatMessageBubbleProps {
  payload: AiChatMessagePayload;
  isOwnMessage: boolean;
}

function ChatMessageBubble({ payload, isOwnMessage }: ChatMessageBubbleProps) {
  const isAssistant = payload.role === "assistant";
  const initials = getSenderInitials(payload.senderName);
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-default text-[10px] font-semibold text-text-primary",
          isAssistant ? "bg-bg-subtle" : "bg-bg-elevated",
        )}
        title={payload.senderName}
        aria-hidden
      >
        {payload.senderAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={payload.senderAvatarUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : isAssistant ? (
          <Bot className="h-3.5 w-3.5" style={{ color: STATUS_ACCENT }} />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isOwnMessage ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-[11px]",
            isOwnMessage ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-medium text-text-primary">
            {payload.senderName}
          </span>
          <span className="text-text-faint">
            {formatChatTimestamp(payload.timestamp)}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
            isAssistant
              ? payload.isError
                ? "border border-state-error/40 bg-state-error/10 text-state-error"
                : "border border-border-default bg-bg-elevated text-text-primary"
              : "",
          )}
          style={
            !isAssistant
              ? { backgroundColor: USER_BUBBLE_BG, color: USER_BUBBLE_TEXT }
              : undefined
          }
        >
          {payload.content}
        </div>
      </div>
    </div>
  );
}

function getSenderInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) {
    return "?";
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function formatChatTimestamp(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function SpecCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-bg-elevated p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-default bg-bg-subtle text-accent-ai-text">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-sm font-medium text-text-primary">
            E-commerce Backend Spec
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">
            Generated architecture overview covering services, data flow, and
            integration points.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          className="text-text-muted"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  );
}
