import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { randomBytes } from "crypto";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

type InviteData = {
  email: string;
  role: "student" | "instruktor" | "superadmin";
  autoSkolaId?: string;
  instruktorId?: string;
  imePrezime?: string;
  godine?: number;
};

export const createInvite = onCall<InviteData>(async (request) => {
  // LOG 1: Početak
  console.log("========== CREATE INVITE POZVAN ==========");
  console.log("1️⃣ Vreme:", new Date().toISOString());
  console.log("2️⃣ Auth:", request.auth ? `UID: ${request.auth.uid}` : "Nema auth");
  console.log("3️⃣ Celokupni request.data:", JSON.stringify(request.data, null, 2));

  try {
    // Auth provere
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Morate biti ulogovani.");
    }

    const uid = request.auth.uid;
    
    // Provera superadmin
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== "superadmin") {
      throw new HttpsError("permission-denied", "Samo superadmin može slati pozivnice.");
    }

    // Izdvajamo podatke
    const { email, role, autoSkolaId, instruktorId, imePrezime, godine } = request.data;
    
    // LOG 2: Šta smo dobili
    console.log("4️⃣ Email:", email);
    console.log("5️⃣ Role:", role);
    console.log("6️⃣ autoSkolaId PRIMLJEN:", autoSkolaId);
    console.log("7️⃣ Tip autoSkolaId:", typeof autoSkolaId);
    console.log("8️⃣ instruktorId:", instruktorId);
    console.log("9️⃣ imePrezime:", imePrezime);
    console.log("🔟 godine:", godine);

    if (!email || !role) {
      throw new HttpsError("invalid-argument", "Email i rola su obavezni.");
    }

    // SPECIFIČNE PROVERE
    if (role === "instruktor") {
      console.log("🔍 Provera za instruktora - autoSkolaId:", autoSkolaId);
      
      if (!autoSkolaId) {
        console.error("❌ INSTRUKTOR NEMA autoSkolaId!");
        throw new HttpsError("invalid-argument", "Instruktor mora imati autoškolu.");
      }
      
      if (autoSkolaId === "") {
        console.error("❌ autoSkolaId je prazan string!");
        throw new HttpsError("invalid-argument", "Autoškola ne može biti prazna.");
      }
      
      console.log("✅ Instruktor ima autoSkolaId:", autoSkolaId);
    }

    if (role === "student") {
      if (!autoSkolaId || !instruktorId) {
        throw new HttpsError("invalid-argument", "Student mora imati autoškolu i instruktora.");
      }
    }

    // Provera duplikata
    const existingUser = await db.collection("users").where("email", "==", email).get();
    if (!existingUser.empty) {
      throw new HttpsError("already-exists", "Korisnik sa ovim email-om već postoji.");
    }

    const existingInvite = await db.collection("invites")
      .where("email", "==", email)
      .where("used", "==", false)
      .where("expiresAt", ">", admin.firestore.Timestamp.now())
      .get();

    if (!existingInvite.empty) {
      throw new HttpsError("already-exists", "Već postoji aktivna pozivnica.");
    }

    // Generisanje tokena
    const token = randomBytes(32).toString("hex");
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 48 * 60 * 60 * 1000)
    );

    // PRAVLJENJE INVITE DATA - SA LOGOVANJEM
    console.log("📦 Pravim inviteData objekat...");
    
    const inviteData: any = {
      email,
      role,
      token,
      used: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid,
      createdAtHuman: new Date().toISOString(),
    };

    // DODAVANJE autoSkolaId - SA LOGOVANJEM
    if (autoSkolaId) {
      console.log("➕ Dodajem autoSkolaId u inviteData:", autoSkolaId);
      inviteData.autoSkolaId = autoSkolaId;
    } else {
      console.log("⚠️ autoSkolaId nije prosleđen, ne dodajem ga");
    }

    if (instruktorId) {
      inviteData.instruktorId = instruktorId;
    }

    if (imePrezime) {
      inviteData.imePrezime = imePrezime;
    }

    if (godine) {
      inviteData.godine = godine;
    }

    // LOG 3: Konačan inviteData pre čuvanja
    console.log("📦 Konačan inviteData PRE čuvanja:", JSON.stringify(inviteData, null, 2));

    // Čuvanje u bazu
    const inviteRef = await db.collection("invites").add(inviteData);
    console.log("✅ Invite sačuvan sa ID:", inviteRef.id);

    // Provera odmah posle čuvanja
    const savedDoc = await inviteRef.get();
    console.log("🔍 Provera sačuvanog dokumenta:", savedDoc.data());

    // Generisanje linka
    const baseUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : "https://autoskolasampion.com";

    const inviteLink = `${baseUrl}/register?token=${token}`;

    // Vraćanje odgovora
    return {
      success: true,
      inviteLink,
      inviteId: inviteRef.id,
      email,
      role,
      autoSkolaId: autoSkolaId || null,
      instruktorId: instruktorId || null,
      imePrezime: imePrezime || null,
      godine: godine || null,
    };

  } catch (error) {
    console.error("❌ GREŠKA:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", "Došlo je do greške.");
  }
});