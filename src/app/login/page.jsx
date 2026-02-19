"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import ReCaptcha from "@/components/ReCaptcha";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }
    
    setLoading(true);

    try {
      // 🔐 Login request
      const res = await axios.post("/api/auth/login", { ...form, captchaToken });

      if (res.data.token) {
        // ✅ Save token
        localStorage.setItem("token", res.data.token);

        // ✅ Fetch user details to update Navbar instantly
        try {
          const verifyRes = await axios.get("/api/auth/verify", {
            headers: { Authorization: `Bearer ${res.data.token}` },
          });

          if (verifyRes.data?.success && verifyRes.data.user) {
            // Save user
            localStorage.setItem("user", JSON.stringify(verifyRes.data.user));

            // 🔥 Notify Navbar immediately
            window.dispatchEvent(new Event("serenity-auth-update"));
          }
        } catch (verifyErr) {
          console.error("User verify failed:", verifyErr);
        }

        // ✅ Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError("Invalid server response. Try again later.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white transition-colors px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-300 shadow-lg p-4 md:p-8 rounded-2xl w-full max-w-md"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center text-[#0097b2] flex items-center justify-center gap-2">
          Welcome Back <LogIn className="w-6 h-6 md:w-7 md:h-7" />
        </h2>

        {error && (
          <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="border border-gray-300 bg-white text-black text-sm md:text-base p-2.5 md:p-3 w-full mb-3 md:mb-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="border border-gray-300 bg-white text-black text-sm md:text-base p-2.5 md:p-3 w-full mb-3 md:mb-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
        />

        {/* CAPTCHA */}
        <div className="mb-4">
          <ReCaptcha
            onVerify={(token) => {
              setCaptchaToken(token);
              setError("");
            }}
            onExpired={() => setCaptchaToken("")}
            onError={() => setError("CAPTCHA verification failed. Please try again.")}
          />
        </div>

        <button
          disabled={loading || !captchaToken}
          className="bg-[#0097b2] hover:bg-[#007a93] text-white text-sm md:text-base px-4 py-2 md:py-2.5 rounded-full w-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-xs md:text-sm text-gray-600 text-center mt-4 md:mt-6">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="text-[#0097b2] hover:underline"
          >
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
