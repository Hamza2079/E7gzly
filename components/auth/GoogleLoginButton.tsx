"use client"
import { createClient } from "@/lib/supabase/client"

export default function GoogleLoginButton() {
    const supabase = createClient();
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`
            }   
        });
        if (error) {
            console.error("Error signing in with Google:", error);
        }
    };
    return (
        <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
            Continue with Google
        </button>
    );
}
