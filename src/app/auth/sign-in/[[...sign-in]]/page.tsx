import React from "react";
import { SignIn as ClerkSignIn } from "@clerk/nextjs";
import { onAuthenticateUser } from "@/actions/user";

const SignIn = async () => {
  const auth = await onAuthenticateUser();
  return <ClerkSignIn />;
};

export default SignIn;
