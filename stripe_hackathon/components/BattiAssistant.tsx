"use client";

import {
  appendAssistantEvent,
  ASSISTANT_SESSION_LIMIT,
  finishAssistantStream,
  remainingAssistantMessages,
} from "@/lib/assistant";
import type {
  AssistantArea,
  AssistantForecast,
  AssistantMessage,
  AssistantReplyState,
} from "@/lib/assistant";
import { parseAssistantStream } from "@/lib/assistant-stream";
import type { AreaId } from "@/lib/types";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type BattiAssistantProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAreaId: AreaId;
  areas: AssistantArea[];
  forecast: AssistantForecast | null;
};

type ConversationMessage =
  | (AssistantMessage & { id: number; role: "user" })
  | { id: number; role: "assistant"; reply: AssistantReplyState };

const EXAMPLES = [
  "Dhanmondi te batti ache?",
  "Current chole gese",
  "Outage er jonno ki prepare korbo?",
];

const EMPTY_REPLY: AssistantReplyState = {
  content: "",
  reportDraft: null,
  status: "streaming",
  errorCode: null,
};

function historyMessage(message: ConversationMessage): AssistantMessage | null {
  if (message.role === "user") {
    return { role: "user", content: message.content };
  }
  if (!message.reply.content.trim()) return null;
  return { role: "assistant", content: message.reply.content };
}

export function BattiAssistant({
  open,
  onOpenChange,
  selectedAreaId,
  areas,
  forecast,
}: BattiAssistantProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);
  const [activeRequest, setActiveRequest] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController>(null);
  const requestActiveRef = useRef(false);
  const nextIdRef = useRef(0);
  const wasOpenRef = useRef(false);
  const selectedArea =
    areas.find((area) => area.id === selectedAreaId) ?? areas[0];
  const remaining = remainingAssistantMessages(submittedCount);
  const latestMessage = messages[messages.length - 1];
  const liveReplyId =
    latestMessage?.role === "assistant" ? latestMessage.id : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open && wasOpenRef.current) {
      launcherRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    const list = messagesRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function close() {
    onOpenChange(false);
  }

  function updateReply(
    id: number,
    update: (reply: AssistantReplyState) => AssistantReplyState,
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id && message.role === "assistant"
          ? { ...message, reply: update(message.reply) }
          : message,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || requestActiveRef.current) {
      return;
    }
    requestActiveRef.current = true;

    const history = messages
      .map(historyMessage)
      .filter((item): item is AssistantMessage => item !== null)
      .slice(-6);
    const userId = nextIdRef.current++;
    const replyId = nextIdRef.current++;
    const controller = new AbortController();
    abortRef.current = controller;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: message },
      { id: replyId, role: "assistant", reply: EMPTY_REPLY },
    ]);
    setInput("");
    setSubmittedCount((count) => count + 1);
    setActiveRequest(true);

    let reply = EMPTY_REPLY;
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAreaId,
          areas,
          history,
          message,
          forecast,
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error("assistant_request_failed");
      }

      for await (const streamEvent of parseAssistantStream(response.body)) {
        const nextReply = appendAssistantEvent(reply, streamEvent);
        reply = nextReply;
        updateReply(replyId, () => nextReply);
      }
      const finishedReply = finishAssistantStream(reply);
      if (finishedReply !== reply) {
        updateReply(replyId, () => finishedReply);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        updateReply(replyId, (reply) =>
          appendAssistantEvent(reply, {
            type: "error",
            code: "stream_failed",
          }),
        );
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      requestActiveRef.current = false;
      setActiveRequest(false);
    }
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className="assistant-launcher"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(true)}
      >
        Ask Batti
      </button>

      <dialog
        ref={dialogRef}
        className="assistant-backdrop"
        aria-labelledby="assistant-heading"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <section className="assistant-sheet">
            <header className="assistant-header">
              <div>
                <p className="assistant-kicker">Selected Area</p>
                <h2 id="assistant-heading">Ask Batti</h2>
                <p className="assistant-area">{selectedArea?.name}</p>
              </div>
              <button
                type="button"
                className="assistant-close"
                aria-label="Close Ask Batti"
                onClick={close}
              >
                Close
              </button>
            </header>

            {messages.length === 0 ? (
              <div className="assistant-intro">
                <p className="assistant-privacy">
                  Your message and selected Area are sent to an AI provider.
                  Batti does not store conversation history server-side.
                </p>
                <p>Try asking:</p>
                <div className="assistant-examples">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setInput(example);
                        inputRef.current?.focus();
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div ref={messagesRef} className="assistant-messages">
              {messages.map((message) =>
                message.role === "user" ? (
                  <article
                    key={message.id}
                    className="assistant-message assistant-message-user"
                  >
                    <span>You</span>
                    <p>{message.content}</p>
                  </article>
                ) : (
                  <article
                    key={message.id}
                    className="assistant-message assistant-message-batti"
                  >
                    <span>Batti</span>
                    <p
                      aria-live={
                        message.id === liveReplyId ? "polite" : undefined
                      }
                      aria-busy={
                        message.id === liveReplyId &&
                        message.reply.status === "streaming"
                      }
                    >
                      {message.reply.status === "error"
                        ? "Response incomplete."
                        : message.reply.content ||
                          (message.reply.status === "streaming"
                            ? "Thinking…"
                            : "I could not complete that response.")}
                      {message.reply.status === "streaming" ? (
                        <i className="assistant-cursor" aria-hidden="true" />
                      ) : null}
                    </p>
                  </article>
                ),
              )}
            </div>

            <form className="assistant-form" onSubmit={submit}>
              <label htmlFor="assistant-question">
                Ask in Bangla, English, or Banglish
              </label>
              <div>
                <input
                  ref={inputRef}
                  id="assistant-question"
                  value={input}
                  maxLength={1000}
                  disabled={activeRequest}
                  onChange={(event) => setInput(event.currentTarget.value)}
                />
                <button
                  type="submit"
                  disabled={activeRequest || input.trim().length === 0}
                >
                  Send
                </button>
              </div>
              <p className="assistant-remaining">
                {remaining} of {ASSISTANT_SESSION_LIMIT} messages remaining
              </p>
            </form>
        </section>
      </dialog>
    </>
  );
}
