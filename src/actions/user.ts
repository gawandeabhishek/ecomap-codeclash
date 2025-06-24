"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export const onAuthenticateUser = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return { status: 403, error: "User not authenticated" };
    }

    const userExist = await prisma.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (userExist) {
      return { status: 200, user: userExist };
    }

    // Create a new user if not found
    const newUser = await prisma.user.create({
      data: {
        clerkUserId: user.id,
        billingEmail: user.emailAddresses[0].emailAddress,
        name: user.firstName || null, // Fallback if missing
        lastName: user.lastName || null, // Fallback if missing
        subscriptions: {},
      },
    });

    if (newUser) {
      return { status: 200, user: newUser };
    }

    return { status: 400, error: "Failed to create user" };
  } catch (error) {
    console.error("Error in onAuthenticateUser:", error); // Log the actual error
    return { status: 500, error: error || "Internal Server Error" };
  }
};
