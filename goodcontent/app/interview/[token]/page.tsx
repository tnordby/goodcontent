import { GuestInterviewClient } from "./view";

interface InterviewGuestPageProps {
  params: Promise<{ token: string }>;
}

export default async function InterviewGuestPage({ params }: InterviewGuestPageProps) {
  const { token } = await params;
  return (
    <GuestInterviewClient token={token} />
  );
}

