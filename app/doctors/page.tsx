import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Find Doctors",
  description: "Browse our network of verified doctors. Filter by specialty, location, and availability.",
};

export default function DoctorsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="mt-2 text-gray-500">
            Browse our network of top-rated, verified healthcare professionals.
          </p>
        </div>

        {/* TODO: Add <ProviderFilters /> component */}
        <div className="mb-6 rounded-lg border bg-gray-50 p-4 text-center text-sm text-gray-400">
          [ ProviderFilters placeholder ]
        </div>

        {/* TODO: Provider grid with <DoctorCard /> components */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex h-72 items-center justify-center rounded-xl border bg-white text-sm text-gray-400 shadow-sm"
            >
              [ DoctorCard #{i + 1} ]
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex justify-center">
          <div className="rounded-lg border bg-gray-50 px-4 py-2 text-sm text-gray-400">
            [ Pagination placeholder ]
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
