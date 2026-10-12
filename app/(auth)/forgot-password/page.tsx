import { forgotPassword } from "@/app/(auth)/actions";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "نسيت كلمة المرور",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            إحجزلي
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">نسيت كلمة المرور؟</h1>
          <p className="mt-1 text-sm text-gray-500">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {params.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {params.error}
          </div>
        )}
        {params.message && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {params.message}
          </div>
        )}

        {!params.message && (
          <form action={forgotPassword} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
                dir="ltr"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              إرسال رابط إعادة التعيين
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          تذكرت كلمة المرور؟{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
