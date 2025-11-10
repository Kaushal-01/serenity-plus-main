"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/auth/signup", form);

      if (res.data.success) {
        // ✅ Save token and user if returned
        if (res.data.token) localStorage.setItem("token", res.data.token);
        if (res.data.user)
          localStorage.setItem("user", JSON.stringify(res.data.user));

        // ✅ Trigger Navbar update instantly
        window.dispatchEvent(new Event("serenity-auth-update"));

        // Redirect to onboarding
        router.push("/onboarding");
      } else {
        setError(res.data.error || "Signup failed. Try again later.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black overflow-hidden text-white">
      {/* 🌈 Glowing background accents */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.15),transparent_60%)]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,150,255,0.15),transparent_60%)]"
      />

      {/* ✨ Signup Card */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,255,255,0.1)] rounded-2xl p-8 w-[90%] max-w-md"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Create Your Account ✨
        </h2>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mb-4"
          >
            {error}
          </motion.p>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 placeholder-gray-400 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 placeholder-gray-400 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-full bg-white/5 border border-white/10 placeholder-gray-400 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="w-full py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-500 transition-all text-white font-semibold mt-2 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </motion.button>
        </div>

        <p className="text-sm text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-cyan-400 hover:underline hover:text-cyan-300"
          >
            Log in
          </a>
        </p>
      </motion.form>
    </div>
  );
}
