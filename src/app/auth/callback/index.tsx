import { GetServerSideProps } from "next";
import { currentUser } from "@clerk/nextjs/server"; // Clerk's server-side method
import { onAuthenticateUser } from "@/actions/user"; // Your authentication function

const AuthCallback = () => {
  return <div>Loading...</div>;
};

// Server-side function for handling authentication
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Ensure you are passing context to currentUser to extract the session correctly
    const user = await currentUser();

    if (!user) {
      return {
        redirect: {
          destination: "/auth/sign-in", // Redirect if no user is found
          permanent: false,
        },
      };
    }

    // Perform your server-side authentication
    const auth = await onAuthenticateUser();

    if (auth.status === 200) {
      return {
        redirect: {
          destination: "/navigation", // Redirect to home after successful authentication
          permanent: false,
        },
      };
    }

    // If something goes wrong with authentication, redirect to sign-in
    return {
      redirect: {
        destination: "/auth/sign-in",
        permanent: false,
      },
    };
  } catch (error) {
    console.error("Error during authentication", error);
    return {
      redirect: {
        destination: "/auth/sign-in", // Redirect on error
        permanent: false,
      },
    };
  }
};

export default AuthCallback;
