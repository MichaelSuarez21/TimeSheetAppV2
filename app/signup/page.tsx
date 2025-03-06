import { Metadata } from 'next';
import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata: Metadata = {
  title: 'Sign Up | TimeSheet App',
  description: 'Create a new TimeSheet account',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">TimeSheet App</h1>
          <p className="mt-2 text-gray-600">Create your account to track work hours</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
} 