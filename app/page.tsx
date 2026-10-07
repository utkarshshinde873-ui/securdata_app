"use client";

import Link from "next/link";
import { ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#080909] text-white">
      <div className="mx-auto max-w-7xl px-5 py-5">

        {/* NAVBAR */}
        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-black/80 px-5 py-3 backdrop-blur-xl">

          <Link href="/" className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
              <ShieldCheck size={18} />
            </div>

            <span className="font-medium">
              SecureData
            </span>

          </Link>


          <div className="hidden items-center gap-1 rounded-full bg-white/5 p-1 text-sm text-gray-400 sm:flex">

            <span className="rounded-full bg-white/10 px-4 py-2 text-white">
              Dashboard
            </span>

            <Link
              href="/encrypt"
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
            >
              Encrypt
            </Link>

            <Link
              href="/decrypt"
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
            >
              Decrypt
            </Link>

          </div>


          <div className="flex items-center gap-2 text-xs text-gray-400">

            <span className="h-2 w-2 rounded-full bg-green-400" />

            Local Only

          </div>

        </nav>


        {/* HERO */}
        <section className="relative mt-6 min-h-[560px] overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0c0c] p-8 sm:p-12 lg:p-16">

          <div className="absolute right-[-100px] top-[-150px] h-[600px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(220,230,230,0.18),transparent_65%)] blur-3xl" />


          <div className="relative flex min-h-[460px] flex-col justify-between">

            <div className="flex justify-between text-xs uppercase tracking-widest text-gray-600">

              <span>
                SecureData System
              </span>

              <span className="hidden sm:block">
                Client-Side Privacy / 01
              </span>

            </div>


            <div className="max-w-4xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400">

                <LockKeyhole size={14} />

                Zero server access

              </div>


              <h1 className="text-5xl font-medium leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">

                One place for your

                <span className="block bg-gradient-to-r from-white via-gray-200 to-gray-600 bg-clip-text text-transparent">

                  private data.

                </span>

              </h1>


              <p className="mt-8 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">

                Encrypt and decrypt sensitive information directly in your
                browser. Your password, encryption keys and plaintext never
                leave your device.

              </p>


              <div className="mt-8 flex flex-wrap gap-3">

                <Link
                  href="/encrypt"
                  className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-gray-200"
                >

                  Start encrypting

                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">

                    <ArrowUpRight size={14} />

                  </span>

                </Link>


                <Link
                  href="/decrypt"
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm text-gray-300 transition hover:bg-white/10"
                >
                  Decrypt data
                </Link>

              </div>

            </div>


            <div className="flex flex-wrap gap-8 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.2em] text-gray-600">

              <span>
                AES-256-GCM
              </span>

              <span>
                PBKDF2-SHA256
              </span>

              <span>
                Web Crypto API
              </span>

              <span>
                Local Processing
              </span>

            </div>

          </div>

        </section>


        {/* LOWER CARDS */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">


          {/* DATA PROTECTION */}

          <div className="min-h-[330px] rounded-[30px] border border-white/10 bg-[#0c0d0d] p-8 sm:p-10">

            <p className="text-xs uppercase tracking-widest text-gray-600">
              Data Protection
            </p>


            <h2 className="mt-5 max-w-lg text-3xl font-medium sm:text-4xl">

              Protect your files with a single password.

            </h2>


            <p className="mt-4 max-w-lg text-sm leading-6 text-gray-500">

              Secure text and files using authenticated AES-256-GCM
              encryption with password-based key derivation.

            </p>


            <div className="mt-10 grid grid-cols-2 gap-3">


              <Link
                href="/encrypt"
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
              >

                <div className="flex justify-between">

                  <span className="text-sm">
                    Encrypt
                  </span>

                  <ArrowUpRight
                    size={16}
                    className="text-gray-600 group-hover:text-white"
                  />

                </div>


                <p className="mt-8 text-xs text-gray-600">
                  Create secure package
                </p>

              </Link>


              <Link
                href="/decrypt"
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
              >

                <div className="flex justify-between">

                  <span className="text-sm">
                    Decrypt
                  </span>

                  <ArrowUpRight
                    size={16}
                    className="text-gray-600 group-hover:text-white"
                  />

                </div>


                <p className="mt-8 text-xs text-gray-600">
                  Restore original data
                </p>

              </Link>

            </div>

          </div>


          {/* SECURITY CORE */}

          <div className="min-h-[330px] rounded-[30px] border border-white/10 bg-[#0c0d0d] p-8 sm:p-10">

            <p className="text-xs uppercase tracking-widest text-gray-600">
              Security Core
            </p>


            <h2 className="mt-5 text-3xl font-medium sm:text-4xl">

              Modern cryptography.

            </h2>


            <div className="mt-8 space-y-3">


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex justify-between">

                  <span>
                    AES-256-GCM
                  </span>

                  <span className="text-xs text-green-400">
                    Active
                  </span>

                </div>


                <p className="mt-2 text-xs text-gray-600">
                  Authenticated encryption
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex justify-between">

                  <span>
                    PBKDF2-SHA256
                  </span>

                  <span className="text-xs text-green-400">
                    Active
                  </span>

                </div>


                <p className="mt-2 text-xs text-gray-600">
                  600,000 password derivation iterations
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <div className="flex justify-between">

                  <span>
                    Local Processing
                  </span>

                  <span className="text-xs text-green-400">
                    ON
                  </span>

                </div>


                <p className="mt-2 text-xs text-gray-600">
                  No password or plaintext upload
                </p>

              </div>


            </div>

          </div>

        </section>


        {/* FOOTER */}

        <footer className="flex justify-between py-8 text-xs text-gray-700">

          <span>
            SecureData · Privacy by design
          </span>

          <span>
            Nothing leaves your browser.
          </span>

        </footer>

      </div>

    </main>
  );
}