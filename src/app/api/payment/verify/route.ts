import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id } = body;
    if (!razorpay_payment_id)
      return NextResponse.json(
        { error: "Missing payment id" },
        { status: 400 }
      );

    // Create or update subscription
    let subscription = await prisma.subscription.findFirst({
      where: { user: { clerkUserId: user.id } },
    });
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          user: { connect: { clerkUserId: user.id } },
          razorpaySubscriptionId: razorpay_order_id || razorpay_payment_id,
          razorpayPlanId: "test_plan", // You can update this as needed
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE" },
      });
    }
    // Store payment
    await prisma.payment.create({
      data: {
        subscription: { connect: { id: subscription.id } },
        razorpayPaymentId: razorpay_payment_id,
        amount: 120000, // 1200 INR in paise
        currency: "INR",
        status: "CAPTURED",
        method: "razorpay",
        invoiceId: razorpay_order_id || null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
