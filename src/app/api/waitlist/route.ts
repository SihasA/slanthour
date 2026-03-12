import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Use service role to bypass RLS — waitlist INSERT is also allowed via RLS,
// but service role lets us return more useful error messages.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, instagram_handle, message } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    // Sanitise instagram handle — strip leading @
    const handle = instagram_handle
      ? String(instagram_handle).replace(/^@/, "").trim()
      : null;

    const { error } = await supabase.from("waitlist").insert({
      name: name ? String(name).trim().slice(0, 200) : null,
      email: String(email).trim().toLowerCase().slice(0, 320),
      instagram_handle: handle ? handle.slice(0, 100) : null,
      message: message ? String(message).trim().slice(0, 2000) : null,
    });

    if (error) {
      // Unique constraint on email
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already on the waitlist." },
          { status: 409 }
        );
      }
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
