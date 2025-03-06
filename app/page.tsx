import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-6 border-b">
        <div className="text-2xl font-bold">TimeSheet App</div>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-20 px-6 text-center max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">Track Your Work Hours Efficiently</h1>
          <p className="text-xl mb-10 text-gray-600">
            A simple and powerful timesheet application for professionals to log and manage their work hours on projects.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </section>

        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center">Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Time Tracking</h3>
                <p className="text-gray-600">Log hours worked on projects with easy-to-use forms and calendar views.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Project Management</h3>
                <p className="text-gray-600">Create and organize projects to effectively manage your workload.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">Reports & Analytics</h3>
                <p className="text-gray-600">Generate detailed reports and export them as PDFs for your records.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xl font-bold mb-4 md:mb-0">TimeSheet App</div>
            <div className="flex gap-8">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              <Link href="/contact" className="hover:underline">Contact Us</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-300">
            &copy; {new Date().getFullYear()} TimeSheet App. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
