"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔐 Login request
      const res = await axios.post("/api/auth/login", form);

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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(0,255,255,0.1)] p-8 rounded-2xl w-96"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Welcome Back 👋
        </h2>

        {error && (
          <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="border border-gray-700 bg-gray-800 text-white p-3 w-full mb-4 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="border border-gray-700 bg-gray-800 text-white p-3 w-full mb-4 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />

        <button
          disabled={loading}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-full w-full transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-gray-400 text-center mt-6">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-cyan-400 hover:underline hover:text-cyan-300"
          >
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
