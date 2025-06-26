import { onAuthenticateUser } from "@/actions/user";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await onAuthenticateUser();
  return NextResponse.json(result);
}
