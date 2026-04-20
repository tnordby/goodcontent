import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            👋 Welcome back!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account to continue.
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
