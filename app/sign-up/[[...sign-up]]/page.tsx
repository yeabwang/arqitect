import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

const clerkAppearance = {
  elements: {
    rootBox: "w-full!",
    cardBox: "w-full! shadow-none!",
    card:
      "w-full! bg-bg-surface! border! border-border-default! rounded-2xl! p-8! sm:p-10! shadow-[0_25px_50px_-12px_var(--shadow-overlay-40)]!",

    header: "mb-6! text-center! items-center!",
    headerTitle:
      "font-mono! text-2xl! sm:text-[28px]! font-medium! tracking-tight! text-text-primary! leading-tight!",
    headerSubtitle: "mt-2! text-sm! text-text-muted! font-sans!",

    main: "gap-5!",

    socialButtonsBlockButton:
      "h-9! py-0! px-4! rounded-md! bg-transparent! border! border-border-subtle! text-[13px]! font-medium! text-text-primary! hover:bg-bg-surface! hover:border-border-hover! transition-colors! shadow-none! normal-case!",
    socialButtonsBlockButtonText: "font-sans! text-[13px]! font-medium!",
    socialButtonsProviderIcon: "h-4! w-4!",

    dividerRow: "my-1!",
    dividerLine: "bg-border-default!",
    dividerText:
      "font-mono! text-[11px]! tracking-[0.02em]! text-text-muted! normal-case!",

    formFieldRow: "gap-1.5!",
    formFieldLabel:
      "font-mono! text-[11px]! tracking-[0.02em]! text-text-muted! mb-1.5! normal-case!",
    formFieldInput:
      "h-9! py-0! px-3! text-[13px]! rounded-md! bg-bg-base! border! border-border-subtle! text-text-primary! placeholder:text-text-faint! focus:border-border-hover! focus:ring-0! focus:outline-none! shadow-none!",
    formFieldInputShowPasswordButton: "text-text-muted! hover:text-text-primary!",

    otpCodeFieldInputs: "gap-2!",
    otpCodeFieldInput:
      "h-10! w-10! text-[15px]! font-mono! rounded-md! bg-bg-base! border! border-border-subtle! text-text-primary! caret-text-primary! focus:border-border-hover! focus:ring-0! focus:outline-none! shadow-none!",

    formButtonPrimary:
      "h-9! py-0! px-4! rounded-md! bg-text-primary! text-bg-base! font-sans! text-[13px]! font-medium! hover:bg-interactive-inverse-hover! shadow-none! transition-colors! normal-case! tracking-normal!",

    footer: "hidden!",
    footerAction: "hidden!",
    formResendCodeLink: "text-text-primary! hover:text-text-primary/80!",
    identityPreviewEditButton: "text-text-primary! hover:text-text-primary/80!",
    formFieldAction: "text-text-secondary! hover:text-text-primary!",
    alert: "bg-bg-elevated! border! border-border-default!",
  },
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp appearance={clerkAppearance} />

      <div className="mt-6 space-y-3 text-center">
        <p className="text-sm text-text-muted">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-text-primary underline decoration-text-faint underline-offset-4 hover:decoration-text-primary"
          >
            Sign in
          </Link>
        </p>
        <p className="text-xs text-text-faint">
          By creating an account you agree to our{" "}
          <Link
            href="/terms"
            className="underline decoration-text-faint underline-offset-4 hover:text-text-muted"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline decoration-text-faint underline-offset-4 hover:text-text-muted"
          >
            Privacy
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
