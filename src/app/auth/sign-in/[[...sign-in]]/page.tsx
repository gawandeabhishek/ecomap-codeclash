import { SignIn as ClerkSignIn } from "@clerk/nextjs";

const SignIn = async () => {
  return <ClerkSignIn forceRedirectUrl={"/navigation"} />;
};

export default SignIn;
