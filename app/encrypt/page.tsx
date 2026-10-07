"use client";

import { useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileLock2,
  FileUp,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  encryptText,
  encryptFile,
  serializeEncryptedPackage,
} from "@/lib/crypto";

type InputMode = "text" | "file";

export default function EncryptPage() {
  const [mode, setMode] = useState<InputMode>("text");

  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [encryptedOutput, setEncryptedOutput] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const passwordValid = password.length >= 8;

  const passwordsMatch =
    password.length > 0 && password === confirmPassword;

  const getPasswordStrength = () => {
    if (!password) return "Enter a password";

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return "Weak";
    if (score === 2) return "Fair";
    if (score === 3 || score === 4) return "Strong";

    return "Very Strong";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    setSelectedFile(file);
    setError("");
    setSuccess(false);
    setEncryptedOutput("");
  };

  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFileSelect(event.target.files?.[0]);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const changeMode = (newMode: InputMode) => {
    setMode(newMode);

    setError("");
    setSuccess(false);
    setEncryptedOutput("");
    setProgress(0);

    if (newMode === "text") {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEncrypt = async () => {
    setError("");
    setSuccess(false);
    setEncryptedOutput("");
    setProgress(0);

    if (mode === "text" && !text.trim()) {
      setError("Please enter some text to encrypt.");
      return;
    }

    if (mode === "file" && !selectedFile) {
      setError("Please select a file to encrypt.");
      return;
    }

    if (!passwordValid) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      setIsEncrypting(true);
      setProgress(10);

      progressTimer = setInterval(() => {
        setProgress((current) => {
          if (current >= 90) {
            return current;
          }

          return Math.min(current + 5, 90);
        });
      }, 300);

      let encryptedPackage;

      if (mode === "text") {
        encryptedPackage = await encryptText(
          text,
          password
        );
      } else {
        encryptedPackage = await encryptFile(
          selectedFile!,
          password
        );
      }

      const serialized =
        serializeEncryptedPackage(encryptedPackage);

      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setProgress(100);
      setEncryptedOutput(serialized);
      setSuccess(true);

    } catch {
      if (progressTimer) {
        clearInterval(progressTimer);
      }

      setProgress(0);
      setError("Encryption failed. Please try again.");

    } finally {
      setIsEncrypting(false);
    }
  };

  const handleCopy = async () => {
    if (!encryptedOutput) return;

    await navigator.clipboard.writeText(encryptedOutput);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    if (!encryptedOutput) return;

    const blob = new Blob([encryptedOutput], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    if (mode === "file" && selectedFile) {
      const originalName = selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/\s+/g, "_");

      link.download = `${originalName}.securedata`;
    } else {
      link.download = "encrypted.securedata";
    }

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#080909] text-white">

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0">

        <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-white/[0.04] blur-3xl" />

        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-white/[0.03] blur-3xl" />

      </div>


      <div className="relative mx-auto max-w-7xl px-5 py-5 sm:px-8">

        {/* NAVBAR */}

        <nav className="flex items-center justify-between rounded-full border border-white/10 bg-black/70 px-5 py-3 backdrop-blur-xl">

          <a
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">

              <ShieldCheck size={18} />

            </div>

            <span className="font-medium">
              SecureData
            </span>

          </a>


          <div className="hidden items-center gap-1 rounded-full bg-white/[0.04] p-1 text-sm text-gray-400 sm:flex">

            <a
              href="/"
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
            >
              Dashboard
            </a>

            <span className="rounded-full bg-white/10 px-4 py-2 text-white">
              Encrypt
            </span>

            <a
              href="/decrypt"
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
            >
              Decrypt
            </a>

          </div>


          <div className="flex items-center gap-2 text-xs text-gray-400">

            <span className="h-2 w-2 rounded-full bg-green-400" />

            Local Only

          </div>

        </nav>


        {/* HERO */}

        <section className="relative mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0d0d]">

          <div className="absolute right-[-150px] top-[-200px] h-[650px] w-[650px] rounded-full bg-[radial-gradient(circle,rgba(220,230,230,0.15),transparent_65%)] blur-3xl" />


          <div className="relative px-7 py-12 sm:px-12 lg:px-16">

            {/* HEADER */}

            <div className="mb-10 flex justify-between text-xs uppercase tracking-[0.2em] text-gray-600">

              <span>
                SecureData / Encrypt
              </span>

              <span className="hidden sm:block">
                Client-Side Privacy / 02
              </span>

            </div>


            {/* TITLE */}

            <div className="max-w-4xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-gray-400">

                <Lock size={14} />

                Local Encryption

              </div>


              <h1 className="text-5xl font-medium leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">

                Protect your

                <span className="block bg-gradient-to-r from-white via-gray-300 to-gray-600 bg-clip-text text-transparent">

                  private data.

                </span>

              </h1>


              <p className="mt-6 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">

                Encrypt sensitive information directly in your browser.

                Your password, encryption keys and plaintext never leave
                your device.

              </p>

            </div>


            {/* MODE SWITCH */}

            <div className="mt-10 inline-flex rounded-full border border-white/10 bg-black/40 p-1">

              <button
                onClick={() => changeMode("text")}
                className={`rounded-full px-6 py-2.5 text-sm transition ${
                  mode === "text"
                    ? "bg-white text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                Text
              </button>

              <button
                onClick={() => changeMode("file")}
                className={`rounded-full px-6 py-2.5 text-sm transition ${
                  mode === "file"
                    ? "bg-white text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                File
              </button>

            </div>


            {/* ENCRYPT PANEL */}

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">


              {/* TEXT / FILE */}

              <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">

                {mode === "text" ? (

                  <>
                    <div className="mb-4 flex items-center justify-between">

                      <label className="text-xs uppercase tracking-[0.18em] text-gray-500">

                        Data to Encrypt

                      </label>

                      <span className="text-xs text-gray-700">

                        {text.length} characters

                      </span>

                    </div>


                    <textarea
                      value={text}
                      onChange={(e) =>
                        setText(e.target.value)
                      }
                      placeholder="Enter the text you want to encrypt..."
                      className="min-h-[300px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-white/30"
                    />


                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">

                      <Lock size={14} />

                      Your plaintext stays on this device.

                    </div>
                  </>

                ) : (

                  <>
                    <div className="mb-4">

                      <label className="text-xs uppercase tracking-[0.18em] text-gray-500">

                        File to Encrypt

                      </label>

                    </div>


                    {!selectedFile ? (

                      <div
                        onDragOver={(e) =>
                          e.preventDefault()
                        }
                        onDrop={handleDrop}
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center transition hover:border-white/30 hover:bg-white/[0.03]"
                      >

                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05]">

                          <FileUp
                            size={28}
                            className="text-gray-400"
                          />

                        </div>


                        <p className="text-sm font-medium text-gray-300">

                          Drop your file here

                        </p>


                        <p className="mt-2 text-xs text-gray-600">

                          or click to browse your device

                        </p>


                        <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-gray-700">

                          Any file type supported

                        </p>


                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileInput}
                          className="hidden"
                        />

                      </div>

                    ) : (

                      <div className="min-h-[300px] rounded-2xl border border-white/10 bg-black/30 p-6">

                        <div className="flex h-full min-h-[250px] flex-col justify-center">

                          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                            <div className="flex min-w-0 items-center gap-4">

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">

                                <FileLock2
                                  size={22}
                                  className="text-gray-300"
                                />

                              </div>


                              <div className="min-w-0">

                                <p className="truncate text-sm text-white">

                                  {selectedFile.name}

                                </p>

                                <p className="mt-1 text-xs text-gray-600">

                                  {formatFileSize(
                                    selectedFile.size
                                  )}

                                  {selectedFile.type &&
                                    ` · ${selectedFile.type}`}

                                </p>

                              </div>

                            </div>


                            <button
                              type="button"
                              onClick={removeFile}
                              className="ml-3 rounded-full p-2 text-gray-600 transition hover:bg-white/10 hover:text-white"
                            >

                              <X size={18} />

                            </button>

                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              fileInputRef.current?.click()
                            }
                            className="mt-4 text-xs text-gray-600 hover:text-white"
                          >
                            Choose a different file
                          </button>


                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileInput}
                            className="hidden"
                          />

                        </div>

                      </div>

                    )}


                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">

                      <Lock size={14} />

                      Your file stays on this device.

                    </div>

                  </>

                )}

              </div>


              {/* PASSWORD */}

              <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">

                <label className="mb-3 block text-xs uppercase tracking-[0.18em] text-gray-500">

                  Password

                </label>


                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-gray-700 focus:border-white/30"
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>


                <div className="mt-2 flex justify-between text-xs">

                  <span className="text-gray-600">
                    Minimum 8 characters
                  </span>

                  <span
                    className={
                      password.length < 8
                        ? "text-red-400"
                        : "text-green-400"
                    }
                  >
                    {getPasswordStrength()}
                  </span>

                </div>


                <label className="mb-3 mt-7 block text-xs uppercase tracking-[0.18em] text-gray-500">

                  Confirm Password

                </label>


                <div className="relative">

                  <input
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm password"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-sm text-white outline-none placeholder:text-gray-700 focus:border-white/30"
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirm(!showConfirm)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
                  >

                    {showConfirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>


                {confirmPassword && (

                  <p
                    className={`mt-2 text-xs ${
                      passwordsMatch
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >

                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}

                  </p>

                )}


                {/* PROGRESS */}

                {isEncrypting && (

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">

                    <div className="mb-3 flex items-center justify-between">

                      <span className="text-xs uppercase tracking-[0.18em] text-gray-500">

                        {mode === "file"
                          ? "Encrypting File"
                          : "Encrypting Data"}

                      </span>

                      <span className="text-xs text-gray-500">

                        {progress}%

                      </span>

                    </div>


                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">

                      <div
                        className="h-full rounded-full bg-white transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>


                    <p className="mt-3 text-xs text-gray-600">

                      Processing securely on your device...

                    </p>

                  </div>

                )}


                <button
                  onClick={handleEncrypt}
                  disabled={isEncrypting}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <FileLock2 size={18} />

                  {isEncrypting
                    ? "Encrypting..."
                    : mode === "file"
                      ? "Encrypt File"
                      : "Encrypt Data"}

                </button>

              </div>

            </div>


            {/* SECURITY INFO */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

                <div className="flex items-center gap-2 text-sm">

                  <ShieldCheck
                    size={16}
                    className="text-green-400"
                  />

                  Local Processing

                </div>

                <p className="mt-2 text-xs leading-5 text-gray-600">

                  Your password and plaintext are never
                  uploaded or stored.

                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

                <div className="flex items-center gap-2 text-sm">

                  <Lock
                    size={16}
                    className="text-green-400"
                  />

                  AES-256-GCM

                </div>

                <p className="mt-2 text-xs leading-5 text-gray-600">

                  Fresh salt and IV are generated for
                  every encryption.

                </p>

              </div>

            </div>


            <p className="mt-5 text-xs text-amber-400/70">

              ⚠ SecureData cannot recover your password.
              If you lose it, your encrypted data cannot
              be decrypted.

            </p>


            {error && (

              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">

                {error}

              </div>

            )}

          </div>

        </section>


        {/* RESULT */}

        {success && encryptedOutput && (

          <section className="mt-6 rounded-[30px] border border-green-400/20 bg-[#0b0f0d] p-7 sm:p-9">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-full bg-green-400/10 p-2 text-green-400">

                <Check size={20} />

              </div>

              <div>

                <h2 className="font-medium">
                  Encryption Successful
                </h2>

                <p className="text-sm text-gray-500">

                  {mode === "file"
                    ? "Your file is now securely encrypted."
                    : "Your data is now protected."}

                </p>

              </div>

            </div>


            <textarea
              readOnly
              value={encryptedOutput}
              className="min-h-[230px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-xs leading-6 text-gray-400 outline-none"
            />


            <div className="mt-5 flex flex-col gap-3 sm:flex-row">

              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm hover:bg-white/[0.08]"
              >

                {copied ? (
                  <>
                    <Check size={17} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={17} />
                    Copy Encrypted Data
                  </>
                )}

              </button>


              <button
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black hover:bg-gray-200"
              >

                <Download size={17} />

                Download .securedata

              </button>

            </div>

          </section>

        )}


        <footer className="flex justify-between py-8 text-xs text-gray-700">

          <span>
            SecureData · Privacy by design
          </span>

          <a
            href="/decrypt"
            className="hover:text-white"
          >
            Need to decrypt? →
          </a>

        </footer>

      </div>

    </main>
  );
}