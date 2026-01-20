"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Types
interface RegisterFormData {
  nip: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function PageLogin() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    nip: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  // Login form state
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Handle Register
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validasi
    if (registerData.password !== registerData.confirmPassword) {
      setError("Kata sandi dan konfirmasi kata sandi tidak sama");
      return;
    }

    if (!registerData.termsAccepted) {
      setError("Anda harus menyetujui syarat & ketentuan");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nip: registerData.nip,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          username: registerData.username,
          email: registerData.email,
          phone: registerData.phone,
          password: registerData.password,
          termsAccepted: registerData.termsAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registrasi gagal");
      }

      setSuccess("Registrasi berhasil! Mohon tunggu verifikasi akun oleh Officer sebelum dapat login.");

      // Reset form
      setRegisterData({
        nip: "",
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        termsAccepted: false,
      });

      // Pindah ke form login setelah 2 detik
      setTimeout(() => {
        setIsRegister(false);
        setSuccess("");
      }, 2000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login gagal");
      }

      // Simpan user data ke localStorage untuk management role & session
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Login berhasil! Mengarahkan...");

      // Reset form
      setLoginData({
        email: "",
        password: "",
        rememberMe: false,
      });

      // Redirect ke dashboard dengan delay minimal untuk smooth transition
      setTimeout(() => {
        const user = data.user;
        if (user.role === "OFFICER") {
          router.push("/dashboard/officer");
        } else {
          router.push("/dashboard/staff");
        }
      }, 300);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Mesh Gradient Background - Pure Red Tones */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] animate-blob rounded-full bg-linear-to-r from-red-600/60 via-red-500/50 to-red-700/60 mix-blend-screen blur-3xl"></div>
        <div className="absolute top-1/3 -right-20 h-[400px] w-[400px] animate-blob animation-delay-2000 rounded-full bg-linear-to-l from-red-500/50 via-red-600/50 to-red-700/60 mix-blend-screen blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/4 h-[450px] w-[450px] animate-blob animation-delay-4000 rounded-full bg-linear-to-tr from-red-800/50 via-red-600/40 to-red-500/40 mix-blend-screen blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-linear-to-r from-red-500/30 to-red-600/30 mix-blend-screen blur-3xl"></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[15%] h-3 w-3 animate-float rounded-full bg-white/20"></div>
        <div className="absolute top-40 right-[20%] h-2 w-2 animate-float animation-delay-1000 rounded-full bg-red-400/30"></div>
        <div className="absolute bottom-32 left-[30%] h-4 w-4 animate-float animation-delay-3000 rounded-full bg-white/15"></div>
        <div className="absolute top-1/3 right-[35%] h-2 w-2 animate-float animation-delay-2000 rounded-full bg-red-400/25"></div>
        <div className="absolute top-[25%] left-[10%] h-16 w-16 animate-spin-slow rounded-full border border-white/10"></div>
        <div className="absolute bottom-[20%] right-[15%] h-24 w-24 animate-spin-slow animation-delay-2000 rounded-full border border-red-500/10"></div>
        <div className="absolute top-1/4 right-1/4 h-32 w-px rotate-45 bg-linear-to-b from-transparent via-white/10 to-transparent"></div>
        <div className="absolute bottom-1/3 left-1/3 h-24 w-px -rotate-45 bg-linear-to-b from-transparent via-red-400/10 to-transparent"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[60px_60px]"></div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]"></div>

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>

      {/* Alert Messages */}
      {(error || success) && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.3s_ease-out]">
          <div className={`rounded-xl px-6 py-3 shadow-lg backdrop-blur-sm ${error
            ? "bg-red-500/90 text-white"
            : "bg-emerald-500/90 text-white"
            }`}>
            <p className="text-sm font-medium">{error || success}</p>
          </div>
        </div>
      )}

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <div className="relative overflow-hidden">
          {/* Height placeholder - adjusts based on form */}
          <div
            className={`transition-all duration-500 ${isRegister
              ? "min-h-[860px] md:min-h-[800px]"
              : "min-h-[680px] md:min-h-[620px]"
              }`}
          ></div>

          {/* Forms Container */}
          <div className="absolute inset-0">
            {/* Register Form - LEFT SIDE (always visible) */}
            <div className="absolute inset-y-0 left-0 w-full md:w-1/2">
              <div className="relative flex h-full w-full items-center justify-center bg-white/95 backdrop-blur-xl px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
                <div className="absolute inset-0 bg-linear-to-br from-gray-50/50 to-white/80"></div>
                <div className="absolute top-8 left-8 h-20 w-20 rounded-full bg-linear-to-br from-red-100 to-transparent opacity-60 blur-xl"></div>
                <div className="absolute bottom-12 right-12 h-16 w-16 rounded-full bg-linear-to-br from-red-50 to-transparent opacity-40 blur-xl"></div>

                <div className="relative z-10 w-full max-w-lg px-4">
                  <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      DAFTAR AKUN
                    </h1>
                    <p className="mt-1.5 text-sm text-gray-500">
                      Lengkapi data berikut untuk membuat akun baru
                    </p>
                  </div>

                  <form onSubmit={handleRegister}>
                    {/* NIP Field */}
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        NIP (Nomor Induk Pegawai)
                      </label>
                      <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                        <svg
                          className="mr-2 h-6 w-6 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        <input
                          type="text"
                          required
                          value={registerData.nip}
                          onChange={(e) => setRegisterData({ ...registerData, nip: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                          placeholder="123456789"
                        />
                      </div>
                    </div>

                    {/* Name Row */}
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Nama Depan
                        </label>
                        <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                          <svg
                            className="mr-2 h-6 w-6 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <input
                            type="text"
                            required
                            value={registerData.firstName}
                            onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                            placeholder="Budi"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Nama Belakang
                        </label>
                        <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                          <svg
                            className="mr-2 h-6 w-6 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <input
                            type="text"
                            required
                            value={registerData.lastName}
                            onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                            placeholder="Santoso"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Username */}
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                        <svg
                          className="mr-2 h-6 w-6 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <input
                          type="text"
                          required
                          value={registerData.username}
                          onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                          placeholder="budisantoso"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Alamat Email
                      </label>
                      <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                        <svg
                          className="mr-2 h-6 w-6 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <input
                          type="email"
                          required
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                          placeholder="nama@email.com"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="mb-3">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Nomor Telepon
                      </label>
                      <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                        <svg
                          className="mr-2 h-6 w-6 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <input
                          type="tel"
                          required
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                          placeholder="08123456789"
                        />
                      </div>
                    </div>

                    {/* Password Row */}
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Kata Sandi
                        </label>
                        <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                          <svg
                            className="mr-2 h-6 w-6 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <input
                            type="password"
                            required
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Konfirmasi
                        </label>
                        <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                          <svg
                            className="mr-2 h-6 w-6 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <input
                            type="password"
                            required
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="mb-4">
                      <label className="flex cursor-pointer items-start">
                        <input
                          type="checkbox"
                          checked={registerData.termsAccepted}
                          onChange={(e) => setRegisterData({ ...registerData, termsAccepted: e.target.checked })}
                          className="mt-0.5 mr-2.5 h-4 w-4 rounded border-gray-300 text-red-600 transition focus:ring-red-500 focus:ring-offset-0"
                        />
                        <span className="text-xs text-gray-600">
                          Saya menyetujui{" "}
                          <a href="#" className="text-red-600 hover:underline">
                            Syarat & Ketentuan
                          </a>{" "}
                          serta{" "}
                          <a href="#" className="text-red-600 hover:underline">
                            Kebijakan Privasi
                          </a>
                        </span>
                      </label>
                    </div>

                    {/* Register Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10">
                        {loading ? "Memproses..." : "Daftar Sekarang"}
                      </span>
                      <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:translate-x-0"></div>
                    </button>

                    <div className="my-4 flex items-center">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        atau
                      </span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Back to Login */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setError("");
                        setSuccess("");
                      }}
                      className="group relative w-full overflow-hidden rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:border-red-300 hover:text-red-700 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="relative z-10">Sudah Punya Akun? Masuk</span>
                      <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-red-50 to-red-100 transition-transform duration-300 group-hover:translate-x-0"></div>
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Login Form - RIGHT SIDE (always visible) */}
            <div className="absolute inset-y-0 right-0 w-full md:w-1/2">
              <div className="relative flex h-full w-full items-center justify-center bg-white/95 backdrop-blur-xl px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
                <div className="absolute inset-0 bg-linear-to-br from-gray-50/50 to-white/80"></div>
                <div className="absolute top-8 right-8 h-20 w-20 rounded-full bg-linear-to-br from-red-100 to-transparent opacity-60 blur-xl"></div>
                <div className="absolute bottom-12 left-12 h-16 w-16 rounded-full bg-linear-to-br from-red-50 to-transparent opacity-40 blur-xl"></div>

                <div className="relative z-10 w-full max-w-lg px-4">
                  <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
                      SELAMAT DATANG!
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Masukkan kredensial Anda untuk melanjutkan
                    </p>
                  </div>

                  <form onSubmit={handleLogin}>
                    {/* Email */}
                    <div className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Alamat Email
                      </label>
                      <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-3 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                        <svg
                          className="mr-2 h-4 w-4 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <input
                          type="email"
                          required
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                          placeholder="nama@email.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Kata Sandi
                      </label>
                      <div className="group flex items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-3 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10">
                        <svg
                          className="mr-2 h-4 w-4 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <input
                          type="password"
                          required
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                          placeholder="••••••••••••"
                        />
                      </div>
                    </div>

                    {/* Remember & Forgot */}
                    <div className="mb-5 flex items-center justify-between text-sm">
                      <label className="flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={loginData.rememberMe}
                          onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                          className="mr-2.5 h-4 w-4 rounded border-gray-300 text-red-600 transition focus:ring-red-500 focus:ring-offset-0"
                        />
                        <span className="text-gray-600">Ingat saya</span>
                      </label>
                      <a
                        href="#"
                        className="font-medium text-red-600 transition-colors hover:text-red-700"
                      >
                        Lupa kata sandi?
                      </a>
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-red-700 to-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10">
                        {loading ? "Memproses..." : "Masuk"}
                      </span>
                      <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-red-600 to-red-500 transition-transform duration-300 group-hover:translate-x-0"></div>
                    </button>

                    <div className="my-5 flex items-center">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        atau
                      </span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Sign Up Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="group relative w-full overflow-hidden rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:border-red-300 hover:text-red-700 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="relative z-10">Daftar Akun Baru</span>
                      <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-red-50 to-red-100 transition-transform duration-300 group-hover:translate-x-0"></div>
                    </button>

                    <p className="mt-4 text-center text-xs text-gray-400">
                      Dengan masuk, Anda menyetujui{" "}
                      <a href="#" className="text-red-600 hover:underline">
                        Syarat & Ketentuan
                      </a>{" "}
                      kami
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* IMAGE PANEL - Slides to cover register (left) or login (right) */}
          <div
            className={`absolute inset-y-0 w-full md:w-1/2 z-20 transition-all duration-700 ease-in-out ${isRegister ? "left-1/2" : "left-0"
              }`}
          >
            <div className="relative h-full w-full overflow-hidden">
              {/* Background Image - scaled larger to prevent white edges */}
              <div
                className="absolute -inset-2 bg-cover bg-center scale-110 transition-transform duration-700"
                style={{ backgroundImage: "url('/redlogin.png')" }}
              ></div>

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/30"></div>

              {/* Animated glow */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -left-20 h-64 w-64 animate-blob rounded-full bg-white/5 blur-3xl"></div>
                <div className="absolute bottom-10 right-10 h-48 w-48 animate-blob animation-delay-2000 rounded-full bg-red-400/10 blur-3xl"></div>
              </div>

              {/* Telkom Logo - Top Left */}
              <div className="absolute top-7 left-7 md:top-7 md:left-8 z-20">
                <img
                  src="/logo-telkom.png"
                  alt="Telkom Logo"
                  className="h-12 md:h-16 w-auto object-contain"
                />
              </div>

              {/* Welcome Text */}
              <div className="relative z-10 flex h-full flex-col justify-center p-8 md:p-10 lg:p-12">
                <div>
                  <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-all duration-500">
                    <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                    Sistem Aktif
                  </div>

                  {/* Animated heading with smooth transition */}
                  <div className="mb-4 overflow-hidden">
                    <h1
                      key={isRegister ? 'register' : 'login'}
                      className="text-4xl font-bold leading-tight text-white lg:text-5xl tracking-tight animate-[fadeInSlide_0.5s_ease-out]"
                    >
                      {isRegister ? (
                        <>
                          Bergabung
                          <br />
                          <span className="text-white">bersama kami!</span>
                        </>
                      ) : (
                        <>
                          Halo,
                          <br />
                          <span className="text-white">selamat datang di Syntel!</span>
                        </>
                      )}
                    </h1>
                  </div>

                  {/* Animated paragraph with smooth transition */}
                  <div className="overflow-hidden">
                    <p
                      key={isRegister ? 'register-desc' : 'login-desc'}
                      className="text-sm text-white/90 lg:text-base max-w-xs leading-relaxed mb-6 animate-[fadeInSlide_0.6s_ease-out]"
                    >
                      {isRegister
                        ? "Daftar sekarang untuk mengakses sistem manajemen proyek Digital Telkom."
                        : "Selamat datang di sistem manajemen proyek Digital Telkom. Silakan login untuk melanjutkan."}
                    </p>
                  </div>

                  <button className="group relative overflow-hidden rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-red-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-white/20 hover:scale-105">
                    <span className="relative z-10">Pelajari lebih lanjut</span>
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-red-100 to-white transition-transform duration-300 group-hover:translate-x-0"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
