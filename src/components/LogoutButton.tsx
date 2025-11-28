import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/router";

interface LogoutButtonProps {
  redirectTo?: string; // optional path to redirect after logout
  className?: string;   // optional custom styles
}

export default function LogoutButton({ redirectTo, className }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      if (redirectTo) router.push(redirectTo);
      else alert("Signed out successfully!");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Error signing out. Check console for details.");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${className || ""}`}
    >
      Logout
    </button>
  );
}
