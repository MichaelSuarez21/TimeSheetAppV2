import { Metadata } from 'next';
import { SignInForm } from '@/components/auth/SignInForm';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Sign In | TimeSheet App',
  description: 'Sign in to your TimeSheet account',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">TimeSheet App</h1>
          <p className="mt-2 text-gray-600">Track your work hours efficiently</p>
        </div>
        <Suspense fallback={<div className="text-center p-4">Loading sign in form...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
} 