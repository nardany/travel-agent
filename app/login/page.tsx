"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import styles from "./page.module.css";

export default function Login() {
  const [mode, setMode] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setLoading(true);
    if (!email || !password) {
      setError("Email and password are required!");
      setLoading(false);
      return;
    }

    if (mode && !name) {
      setError("Name is required");
      setLoading(false);
      return;
    }
    try {
      const { error } = mode
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (error) {
        setError(error.message ?? "Something went wrong");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error, Please try again.")
      setLoading(false);
    }
  }

  const changeMode = () => {
    setMode((prev) => !prev)
  }

  return (

    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>
          {mode ? "Create account" : "Welcome back"}
        </h1>
        <button
          type="button"
          className={styles.switchButton}
          onClick={changeMode}
        >
          {mode ? "Switch to Login" : "Switch to Register"}
        </button>

        {error && <p className={styles.error}>{error}</p>}

        {mode && (
          <input
            className={styles.input}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className={styles.submitButton}
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading..." : mode ? "Register" : "Login"}
        </button>
      </form>
    </div>

  )
}