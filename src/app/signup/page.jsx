"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "",
    gender: "",
    ageGroup: "",
    occupation: "",
    listeningHabits: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();



  const handleNext = () => {
    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        setError("Please fill in all required fields");
        return;
      }
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

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
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden text-black dark:text-white transition-colors p-4">
      {/* ✨ Signup Card */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 bg-white border border-gray-300 shadow-lg rounded-2xl p-8 w-[90%] max-w-2xl"
      >
        {/* Progress Indicator */}
        <div className="flex justify-center mb-6 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-[#0097b2]" : s < step ? "w-8 bg-[#0097b2]/50" : "w-8 bg-gray-300"
              }`}
            />
          ))}
        </div>

        <h2 className="text-3xl font-bold mb-2 text-center text-[#0097b2]">
          {step === 1 ? "Create Your Account ✨" : step === 2 ? "Tell Us About You 👤" : "Almost Done! 🎉"}
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          {step === 1 ? "Let's get started with the basics" : step === 2 ? "Help us personalize your experience" : "Just a few more details"}
        </p>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-sm text-center mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 placeholder-gray-500 text-black focus:ring-2 focus:ring-[#0097b2] focus:outline-none"
            />

            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 placeholder-gray-500 text-black focus:ring-2 focus:ring-[#0097b2] focus:outline-none"
            />

            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 placeholder-gray-500 text-black focus:ring-2 focus:ring-[#0097b2] focus:outline-none"
            />

            <motion.button
              type="button"
              onClick={handleNext}
              whileTap={{ scale: 0.95 }}
              className="w-full py-2 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition-all text-white font-semibold mt-2"
            >
              Continue →
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Personal Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <div className="grid grid-cols-3 gap-3">
                {["Male", "Female", "Other"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setForm({ ...form, gender })}
                    className={`py-2 px-4 rounded-full border-2 transition-all ${
                      form.gender === gender
                        ? "border-[#0097b2] bg-[#0097b2] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#0097b2]"
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
              <select
                value={form.ageGroup}
                onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 text-black focus:ring-2 focus:ring-[#0097b2] focus:outline-none"
              >
                <option value="">Select your age group</option>
                <option value="13-17">13-17</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Listening Habits</label>
              <select
                value={form.listeningHabits}
                onChange={(e) => setForm({ ...form, listeningHabits: e.target.value })}
                className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 text-black focus:ring-2 focus:ring-[#0097b2] focus:outline-none"
              >
                <option value="">How often do you listen to music?</option>
                <option value="daily">Daily - Music is my life</option>
                <option value="often">Often - Several times a week</option>
                <option value="sometimes">Sometimes - A few times a week</option>
                <option value="rarely">Rarely - Occasionally</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                type="button"
                onClick={handleBack}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2 rounded-full border-2 border-gray-300 hover:bg-gray-50 transition-all text-gray-700 font-semibold"
              >
                ← Back
              </motion.button>
              <motion.button
                type="button"
                onClick={handleNext}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition-all text-white font-semibold"
              >
                Continue →
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Occupation */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Occupation / Profession</label>
              <select
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                className="w-full px-4 py-2 rounded-full bg-white border border-gray-300 text-black focus:ring-2 focus:ring-[#0097b2] focus:outline-none"
              >
                <option value="">Select your occupation</option>
                <option value="Student">Student</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Doctor">Doctor</option>
                <option value="Teacher">Teacher</option>
                <option value="Business Professional">Business Professional</option>
                <option value="Healthcare Worker">Healthcare Worker</option>
                <option value="Artist/Creative">Artist/Creative</option>
                <option value="Entrepreneur">Entrepreneur</option>
                <option value="Engineer">Engineer</option>
                <option value="Marketing/Sales">Marketing/Sales</option>
                <option value="Freelancer">Freelancer</option>
                <option value="Retired">Retired</option>
                <option value="Homemaker">Homemaker</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                type="button"
                onClick={handleBack}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2 rounded-full border-2 border-gray-300 hover:bg-gray-50 transition-all text-gray-700 font-semibold"
              >
                ← Back
              </motion.button>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                disabled={loading}
                className="flex-1 py-2 rounded-full bg-[#0097b2] hover:bg-[#007a93] transition-all text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </motion.button>
            </div>
          </motion.div>
        )}

        <p className="text-sm text-gray-600 text-center mt-6">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#0097b2] hover:underline"
          >
            Log in
          </a>
        </p>
      </motion.form>
    </div>
  );
}
