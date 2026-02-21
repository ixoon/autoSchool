import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { randomBytes } from "crypto";

// Inicijalizacija Admin SDK-a
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

type InviteData = {
  email: string;
  role: "student" | "instruktor" | "superadmin";
};

export const createInvite = onCall<InviteData>(async (request) => {
  console.log("=== createInvite funkcija pokrenuta ===");
  console.log("Request data:", request.data);
  console.log("Auth:", request.auth);
  
  try {
    // Provera autentifikacije
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Morate biti ulogovani.");
    }

    const uid = request.auth.uid;
    console.log("UID korisnika:", uid);

    // Provera da li je korisnik superadmin
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      throw new HttpsError("permission-denied", "Korisnik ne postoji u bazi.");
    }

    const userData = userDoc.data();
    console.log("User data:", userData);

    if (userData?.role !== "superadmin") {
      throw new HttpsError(
        "permission-denied",
        `Samo superadmin može slati pozivnice. Vaša rola: ${userData?.role || 'nema role'}`
      );
    }

    const { email, role } = request.data;
    console.log("Email:", email, "Role:", role);

    // Validacija podataka
    if (!email || !role) {
      throw new HttpsError("invalid-argument", "Email i rola su obavezni.");
    }

    if (!["student", "instruktor", "superadmin"].includes(role)) {
      throw new HttpsError("invalid-argument", "Neispravna rola.");
    }

    // Provera da li email već postoji
    const existingUser = await db.collection("users").where("email", "==", email).get();
    if (!existingUser.empty) {
      throw new HttpsError("already-exists", "Korisnik sa ovim email-om već postoji.");
    }

    // Provera da li već postoji neiskorišćen invite za ovaj email
    const existingInvite = await db.collection("invites")
      .where("email", "==", email)
      .where("used", "==", false)
      .where("expiresAt", ">", admin.firestore.Timestamp.now())
      .get();

    if (!existingInvite.empty) {
      throw new HttpsError("already-exists", "Već postoji aktivna pozivnica za ovaj email.");
    }

    // Generisanje tokena
    const token = randomBytes(32).toString("hex");
    console.log("Generisan token:", token);

    // Rok trajanja (48h)
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 48 * 60 * 60 * 1000)
    );

    // Kreiranje invite-a
    const inviteData = {
      email,
      role,
      token,
      used: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid,
      createdAtHuman: new Date().toISOString()
    };

    const inviteRef = await db.collection("invites").add(inviteData);
    console.log("Invite kreiran sa ID:", inviteRef.id);

    // Generisanje linka (promeni URL za produkciju)
    const baseUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : "https://tvoj-domen.com"; // Zameni sa tvojim produkcija domenom

    const inviteLink = `${baseUrl}/register?token=${token}`;

    return {
      success: true,
      inviteLink,
      inviteId: inviteRef.id,
      email,
      role,
      expiresAt: expiresAt.toDate().toISOString()
    };
    
  } catch (error) {
    console.error("Greška u createInvite funkciji:", error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError("internal", "Došlo je do interne greške. Pokušajte ponovo.");
  }
});