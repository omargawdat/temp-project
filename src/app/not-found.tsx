import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">404 - Not Found</h2>
      <p className="text-gray-600">Could not find the requested resource.</p>
      <Link
        href="/"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
      >
        Return Home
      </Link>
    </div>
  );
}
