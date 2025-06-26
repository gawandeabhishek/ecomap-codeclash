import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthenticateUser } from "@/actions/user";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function authenticate() {
      try {
        const data = await onAuthenticateUser();
        if (data.status === 200) {
          router.replace("/navigation");
        } else {
          router.replace("/auth/sign-in");
        }
      } catch (error) {
        console.log(error);
        router.replace("/auth/sign-in");
      }
    }
    authenticate();
  }, [router]);

  return <div>Loading...</div>;
}
