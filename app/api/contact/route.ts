import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    // Validacija
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Sva polja su obavezna" },
        { status: 400 }
      );
    }

    // Slanje emaila
    const { data, error } = await resend.emails.send({
      from: "Auto Skola Sampion <support@autoskolasampion.com>",
      to: ["support@autoskolasampion.com"],
      replyTo: email,
      subject: `Nova poruka od ${name} - Auto Skola Sampion`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Nova poruka</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Nova poruka sa kontakt forme</h2>
              
              <div style="margin: 20px 0;">
                <p><strong style="color: #2563eb;">Ime:</strong> ${name}</p>
                <p><strong style="color: #2563eb;">Email:</strong> ${email}</p>
                <p><strong style="color: #2563eb;">Poruka:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
                  ${message.replace(/\n/g, "<br>")}
                </div>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;">Ova poruka je poslata sa kontakt forme sajta autoskolasampion.com</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Greška pri slanju emaila" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Poruka je uspešno poslata!" 
    });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Došlo je do greške na serveru" },
      { status: 500 }
    );
  }
}