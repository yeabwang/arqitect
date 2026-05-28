import { auth } from "@clerk/nextjs/server";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const { userId } = await auth();
  return <LandingPage signedIn={!!userId} />;
}
