import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Ghost AI
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          For real developers only.
        </p>
      </div>
    </div>
  );
}
