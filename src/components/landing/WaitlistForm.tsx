"use client";

import { useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      instagram_handle: (form.elements.namedItem("instagram") as HTMLInputElement).value.trim(),
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim(),
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-start justify-center py-8">
        <p className="font-heading text-2xl italic text-foreground mb-3">
          You&apos;re on the list.
        </p>
        <p className="font-heading text-[15px] italic text-muted leading-relaxed">
          We&apos;ll be in touch when your spot is ready. Keep making work.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input name="name" label="Name" placeholder="Your name" required />
      <Input
        name="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        required
      />
      <Input
        name="instagram"
        label="Instagram"
        placeholder="@handle (optional)"
      />
      <div>
        <label className="text-[9px] uppercase tracking-label text-accent block mb-2">
          About your work
        </label>
        <textarea
          name="message"
          rows={3}
          placeholder="What do you photograph? Link us to your work..."
          className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 resize-none focus:border-accent transition-colors"
        />
      </div>

      {status === "error" && (
        <p className="text-[13px] font-heading italic text-red-400">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="self-start inline-flex items-center gap-3 text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-1 hover:gap-5 hover:text-accent hover:border-accent transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none mt-2"
      >
        {status === "submitting" ? "Sending..." : "Request access"}
        <span className="text-sm">&rarr;</span>
      </button>
    </form>
  );
}

/* ── Reusable input ───────────────────────────────────────── */

function Input({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-[9px] uppercase tracking-label text-accent block mb-2"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors"
      />
    </div>
  );
}
