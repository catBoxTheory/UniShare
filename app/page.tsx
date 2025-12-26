import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MarketingPage } from "@/components/home/MarketingPage";
import { Dashboard } from "@/components/home/Dashboard";
import { getRecentCourses, getEnrolledCourses } from "@/app/actions/courses";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: { tab?: string } }) {
  const session = await auth();

  // Not logged in -> show marketing page
  if (!session?.user) {
    return <MarketingPage />;
  }

  // Logged in -> check onboarding status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isOnboardingCompleted: true }
  });

  if (!user?.isOnboardingCompleted) {
    redirect("/onboarding");
  }

  // Logged in and onboarded -> show dashboard
  const [recentCourses, enrolledCourses] = await Promise.all([
    getRecentCourses(),
    getEnrolledCourses()
  ]);

  return (
    <Dashboard 
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      recentCourses={recentCourses}
      enrolledCourses={enrolledCourses}
      initialTab={searchParams.tab}
    />
  );
}
