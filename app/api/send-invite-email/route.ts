import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  console.log("🚀 API ruta pozvana");
  
  try {
    // Proveri API key
    const apiKey = process.env.RESEND_API_KEY;
    console.log("🔑 API key postoji:", !!apiKey);
    console.log("🔑 Prvih 5 karaktera:", apiKey?.substring(0, 5));

    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY nije postavljen" },
        { status: 500 }
      );
    }

    // Parsiraj body
    const { email, inviteLink } = await req.json();
    console.log("📧 Email:", email);
    console.log("🔗 Link:", inviteLink);

    if (!email || !inviteLink) {
      return NextResponse.json(
        { error: "Nedostaju email ili link" },
        { status: 400 }
      );
    }

    // Inicijalizuj Resend
    const resend = new Resend(apiKey);

    // Pošalji mejl
    console.log("📤 Šaljem mejl...");
    
    const { data, error } = await resend.emails.send({
      from: 'Autoškola Šampion <noreply@autoskolasampion.com>',
      to: email,
      subject: 'Pozivnica za Autoškolu Šampion',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Pozivnica za Autoškolu Šampion</h2>
          <p>Dobili ste pozivnicu za registraciju.</p>
          <a href="${inviteLink}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          ">Registruj se</a>
          <p style="color: #666; font-size: 14px;">Link važi 48h:<br>${inviteLink}</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend greška:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log("✅ Mejl poslat:", data);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Server greška:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}