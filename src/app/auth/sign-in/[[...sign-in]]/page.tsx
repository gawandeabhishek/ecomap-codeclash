import { onAuthenticateUser } from "@/actions/user";
import { SignIn as ClerkSignIn } from "@clerk/nextjs";

const SignIn = async () => {
  await onAuthenticateUser();
  return <ClerkSignIn />;
};

export default SignIn;
