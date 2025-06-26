import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ active: false });
    const subscription = await prisma.subscription.findFirst({
      where: {
        user: { clerkUserId: user.id },
        status: "ACTIVE",
      },
    });
    return NextResponse.json({ active: !!subscription });
  } catch {
    return NextResponse.json({});
  }
}
