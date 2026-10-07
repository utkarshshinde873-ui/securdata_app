"use client";

import { useRef, useState } from "react";
import {
  Check,
  ClipboardPaste,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileLock2,
  FileUp,
  Lock,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  decryptData,
  decryptText,
  downloadDecryptedFile,
  parseEncryptedPackage,
  type EncryptedPackage,
} from "@/lib/crypto";

type InputMode = "upload" | "paste";

export default function DecryptPage() {
  const [mode, setMode] = useState<InputMode>("upload");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedData, setPastedData] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isDecrypting, setIsDecrypting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [decryptedText, setDecryptedText] = useState("");
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [decryptedFileName, setDecryptedFileName] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const clearResult = () => {
    setDecryptedText("");
    setDecryptedBlob(null);
    setDecryptedFileName("");
    setSuccess(false);
    setCopied(false);
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    setSelectedFile(file);
    setError("");
    clearResult();
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
    setError("");
    clearResult();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const changeMode = (newMode: InputMode) => {
    setMode(newMode);

    setError("");
    setProgress(0);
    clearResult();

    setSelectedFile(null);
    setPastedData("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readEncryptedPackage = async (): Promise<EncryptedPackage> => {
    if (mode === "paste") {
      if (!pastedData.trim()) {
        throw new Error(
          "Please paste your encrypted data."
        );
      }

      return parseEncryptedPackage(
        pastedData.trim()
      );
    }

    if (!selectedFile) {
      throw new Error(
        "Please select an encrypted file."
      );
    }

    const fileContent =
      await selectedFile.text();

    return parseEncryptedPackage(
      fileContent
    );
  };

  const handleDecrypt = async () => {
    setError("");
    clearResult();
    setProgress(0);

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "upload" && !selectedFile) {
      setError(
        "Please select an encrypted .securedata file."
      );
      return;
    }

    if (
      mode === "paste" &&
      !pastedData.trim()
    ) {
      setError(
        "Please paste your encrypted data."
      );
      return;
    }

    let progressTimer:
      | ReturnType<typeof setInterval>
      | null = null;

    try {
      setIsDecrypting(true);
      setProgress(10);

      progressTimer = setInterval(() => {
        setProgress((current) => {
          if (current >= 90) {
            return current;
          }

          return Math.min(
            current + 5,
            90
          );
        });
      }, 300);

      const encryptedPackage =
        await readEncryptedPackage();

      setProgress(35);

      const isTextPackage =
        encryptedPackage.mimeType ===
        "text/plain" &&
        !encryptedPackage.fileName;

      if (isTextPackage) {
        const text =
          await decryptText(
            encryptedPackage,
            password
          );

        setDecryptedText(text);
        setDecryptedBlob(null);
        setDecryptedFileName("");
      } else {
        const blob =
          await decryptData(
            encryptedPackage,
            password
          );

        setDecryptedBlob(
          new Blob([blob], {
            type:
              encryptedPackage.mimeType ||
              "application/octet-stream",
          })
        );

        setDecryptedFileName(
          encryptedPackage.fileName ||
            "decrypted-file"
        );

        setDecryptedText("");
      }

      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }

      setProgress(100);
      setSuccess(true);

    } catch (err) {
      if (progressTimer) {
        clearInterval(progressTimer);
      }

      setProgress(0);

      if (err instanceof Error) {
        setError(
          err.message ===
            "Incorrect password or corrupted encrypted data."
            ? err.message
            : err.message ===
                "Invalid or corrupted encrypted package."
              ? err.message
              : "Decryption failed. Check your encrypted data and password."
        );
      } else {
        setError(
          "Decryption failed. Check your encrypted data and password."
        );
      }

    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopy = async () => {
    if (!decryptedText) return;

    await navigator.clipboard.writeText(
      decryptedText
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = () => {
    if (!decryptedBlob) return;

    downloadDecryptedFile(
      decryptedBlob,
      decryptedFileName || "decrypted-file"
    );
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

            <a
              href="/encrypt"
              className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
            >
              Encrypt
            </a>

            <span className="rounded-full bg-white/10 px-4 py-2 text-white">
              Decrypt
            </span>

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
                SecureData / Decrypt
              </span>

              <span className="hidden sm:block">
                Client-Side Privacy / 03
              </span>

            </div>


            {/* TITLE */}

            <div className="max-w-4xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-gray-400">

                <FileLock2 size={14} />

                Local Decryption

              </div>


              <h1 className="text-5xl font-medium leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">

                Restore your

                <span className="block bg-gradient-to-r from-white via-gray-300 to-gray-600 bg-clip-text text-transparent">

                  private data.

                </span>

              </h1>


              <p className="mt-6 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">

                Decrypt your SecureData packages directly
                in your browser. Your password and
                encrypted data stay on your device.

              </p>

            </div>


            {/* MODE SWITCH */}

            <div className="mt-10 inline-flex rounded-full border border-white/10 bg-black/40 p-1">

              <button
                onClick={() =>
                  changeMode("upload")
                }
                className={`rounded-full px-6 py-2.5 text-sm transition ${
                  mode === "upload"
                    ? "bg-white text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                Upload File
              </button>

              <button
                onClick={() =>
                  changeMode("paste")
                }
                className={`rounded-full px-6 py-2.5 text-sm transition ${
                  mode === "paste"
                    ? "bg-white text-black"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                Paste Data
              </button>

            </div>


            {/* MAIN PANEL */}

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">


              {/* INPUT */}

              <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-8">

                {mode === "upload" ? (

                  <>

                    <div className="mb-4">

                      <label className="text-xs uppercase tracking-[0.18em] text-gray-500">

                        Encrypted File

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

                          Drop your encrypted file here

                        </p>


                        <p className="mt-2 text-xs text-gray-600">

                          or click to browse your device

                        </p>


                        <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-gray-700">

                          .securedata files supported

                        </p>


                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".securedata,.enc,application/json"
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
                            accept=".securedata,.enc,application/json"
                            onChange={handleFileInput}
                            className="hidden"
                          />

                        </div>

                      </div>

                    )}


                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">

                      <Lock size={14} />

                      The encrypted package stays on this device.

                    </div>

                  </>

                ) : (

                  <>

                    <div className="mb-4 flex items-center justify-between">

                      <label className="text-xs uppercase tracking-[0.18em] text-gray-500">

                        Encrypted Data

                      </label>

                      <span className="text-xs text-gray-700">

                        {pastedData.length} characters

                      </span>

                    </div>


                    <textarea
                      value={pastedData}
                      onChange={(e) =>
                        setPastedData(e.target.value)
                      }
                      placeholder="Paste your encrypted SecureData package here..."
                      className="min-h-[300px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-xs leading-6 text-gray-300 outline-none transition placeholder:text-gray-700 focus:border-white/30"
                    />


                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">

                      <ClipboardPaste size={14} />

                      Paste the complete encrypted package.

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
                    placeholder="Enter your password"
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


                <p className="mt-2 text-xs leading-5 text-gray-600">

                  Use the same password that was used
                  when the data was encrypted.

                </p>


                {/* PROGRESS */}

                {isDecrypting && (

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">

                    <div className="mb-3 flex items-center justify-between">

                      <span className="text-xs uppercase tracking-[0.18em] text-gray-500">

                        Decrypting

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
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-medium text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <FileDown size={18} />

                  {isDecrypting
                    ? "Decrypting..."
                    : "Decrypt Data"}

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

                  Your password and decrypted data are
                  never uploaded or stored.

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

                  Authentication protects the encrypted
                  data from undetected modification.

                </p>

              </div>

            </div>


            <p className="mt-5 text-xs text-gray-600">

              SecureData does not store your password.
              Keep your password safe for future decryption.

            </p>


            {error && (

              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">

                {error}

              </div>

            )}

          </div>

        </section>


        {/* RESULT */}

        {success && (

          <section className="mt-6 rounded-[30px] border border-green-400/20 bg-[#0b0f0d] p-7 sm:p-9">

            <div className="mb-5 flex items-center gap-3">

              <div className="rounded-full bg-green-400/10 p-2 text-green-400">

                <Check size={20} />

              </div>

              <div>

                <h2 className="font-medium">
                  Decryption Successful
                </h2>

                <p className="text-sm text-gray-500">

                  Your original data has been restored.

                </p>

              </div>

            </div>


            {decryptedText ? (

              <>

                <textarea
                  readOnly
                  value={decryptedText}
                  className="min-h-[230px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-xs leading-6 text-gray-300 outline-none"
                />


                <button
                  onClick={handleCopy}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm hover:bg-white/[0.08]"
                >

                  {copied ? (
                    <>
                      <Check size={17} />
                      Copied
                    </>
                  ) : (
                    <>
                      <ClipboardPaste size={17} />
                      Copy Decrypted Text
                    </>
                  )}

                </button>

              </>

            ) : (

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-400/10">

                      <FileDown
                        size={22}
                        className="text-green-400"
                      />

                    </div>


                    <div className="min-w-0">

                      <p className="truncate text-sm text-white">

                        {decryptedFileName}

                      </p>

                      <p className="mt-1 text-xs text-gray-600">

                        Original file restored successfully

                      </p>

                    </div>

                  </div>


                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-200"
                  >

                    <Download size={17} />

                    Download File

                  </button>

                </div>

              </div>

            )}

          </section>

        )}


        {/* FOOTER */}

        <footer className="flex justify-between py-8 text-xs text-gray-700">

          <span>
            SecureData · Privacy by design
          </span>

          <a
            href="/encrypt"
            className="hover:text-white"
          >
            Need to encrypt? →
          </a>

        </footer>

      </div>

    </main>
  );
}