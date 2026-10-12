import { resetPassword } from "@/app/(auth)/actions";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "إعادة تعيين كلمة المرور",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            إحجزلي
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">إعادة تعيين كلمة المرور</h1>
          <p className="mt-1 text-sm text-gray-500">أدخل كلمة المرور الجديدة</p>
        </div>

        {params.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {params.error}
          </div>
        )}

        <form action={resetPassword} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              كلمة المرور الجديدة
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              minLength={6}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              تأكيد كلمة المرور
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            تغيير كلمة المرور
          </button>
        </form>
      </div>
    </div>
  );
}
