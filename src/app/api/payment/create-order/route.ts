import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { amount, currency } = await req.json();
  const key_id = process.env.RAZORPAY_TEST_KEY_ID;
  const key_secret = process.env.RAZORPAY_TEST_SECRET_KEY;

  if (!key_id || !key_secret) {
    return NextResponse.json(
      { error: { description: "Razorpay keys not configured" } },
      { status: 500 }
    );
  }

  const orderPayload = {
    amount, // in paise
    currency,
    receipt: `receipt_${Date.now()}`,
    payment_capture: 1,
  };

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64"),
    },
    body: JSON.stringify(orderPayload),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data.error }, { status: 400 });
  }
  return NextResponse.json(data);
}
