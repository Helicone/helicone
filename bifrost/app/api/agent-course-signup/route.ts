import { NextRequest, NextResponse } from "next/server";

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    try {
      const referer = request.headers.get("referer") || "direct";
      const userAgent = request.headers.get("user-agent") || "unknown";
      const normalizedEmail = email.toLowerCase().trim();

      // Step 1: Create or update the contact in Loops
      const contactResponse = await fetch("https://app.loops.so/api/v1/contacts/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LOOPS_API_KEY}`
        },
        body: JSON.stringify({
          email: normalizedEmail,
          agent_course_enrolled: true,
          agent_course_source: source || "agent-course-page",
          agent_course_signup_date: new Date().toISOString()
        })
      });

      if (!contactResponse.ok) {
        const errorText = await contactResponse.text();
        console.error({ status: contactResponse.status, error: errorText }, "Failed to update Loops contact");
      } else {
        console.log({ email: normalizedEmail }, "Successfully created/updated Loops contact");
      }

      // Step 2: Send the event to trigger the email sequence
      const eventResponse = await fetch("https://app.loops.so/api/v1/events/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LOOPS_API_KEY}`
        },
        body: JSON.stringify({
          email: normalizedEmail,
          eventName: "email-course-signup",
          eventProperties: {
            source: source || "agent-course-page",
            signup_date: new Date().toISOString(),
            referer: referer,
            user_agent: userAgent
          }
        })
      });

      if (!eventResponse.ok) {
        const errorText = await eventResponse.text();
        console.error({ status: eventResponse.status, error: errorText }, "Failed to send Loops event");
      } else {
        console.log({ email: normalizedEmail, eventName: "email-course-signup" }, "Successfully sent Loops event");
      }
    } catch (loopsError) {
      console.error({ error: loopsError }, "Failed to interact with Loops API");
    }

    return NextResponse.json({
      success: true,
      message: "Successfully registered for the agent course"
    });
  } catch (error) {
    console.error("Error in agent-course-signup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

