"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { callCreateCourse } from "@/lib/functionsClient";
import { useRouter } from "next/navigation";

export default function CreateCoursePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && !user) {
    if (typeof window !== "undefined") window.location.href = "/auth/login";
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = { title, description, price: Number(price || 0) };
      const res = await callCreateCourse(payload);
      // navigate to the new course page (you can implement route after you add course detail)
      router.push(`/courses/${res.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create course");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Course</h1>
      <form onSubmit={handleCreate} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Course title" value={title} onChange={(e)=>setTitle(e.target.value)} required />
        <textarea className="w-full p-2 border rounded" placeholder="Short description" value={description} onChange={(e)=>setDescription(e.target.value)} rows={4} />
        <input className="w-full p-2 border rounded" placeholder="Price (0 for free)" value={price} onChange={(e)=>setPrice(e.target.value === "" ? "" : Number(e.target.value))} />
        <button className="p-2 bg-green-600 text-white rounded" disabled={busy}>{busy ? "Creating..." : "Create Course"}</button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
