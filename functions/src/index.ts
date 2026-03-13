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
  autoSkolaId?: string | null;
  instruktorId?: string | null;
  imePrezime?: string | null;  // <-- DODATO
  godine?: number | null;      // <-- DODATO (ako ti treba)
};

export const createInvite = onCall<InviteData>(async (request) => {
  console.log("=== createInvite funkcija pokrenuta ===");
  console.log("Request data:", request.data);
  console.log("Auth:", request.auth);

  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Morate biti ulogovani.");
    }

    console.log("OVO JE NOVA VERZIJA FUNKCIJE SA IMENOM 123456");
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

    const { email, role, autoSkolaId = null, instruktorId = null, imePrezime = null, godine = null } = request.data;  // <-- DODATO
    console.log("Email:", email, "Role:", role, "AutoSkolaId:", autoSkolaId, "InstruktorId:", instruktorId, "ImePrezime:", imePrezime);  // <-- DODATO

    if (!email || !role) {
      throw new HttpsError("invalid-argument", "Email i rola su obavezni.");
    }

    if (!["student", "instruktor", "superadmin"].includes(role)) {
      throw new HttpsError("invalid-argument", "Neispravna rola.");
    }

    // SERVER-SIDE validacije
    if (role === "instruktor" && (!autoSkolaId || autoSkolaId === "")) {
      throw new HttpsError("invalid-argument", "Instruktor mora imati izabranu autoškolu.");
    }
    if (role === "student" && ((!autoSkolaId || autoSkolaId === "") || (!instruktorId || instruktorId === ""))) {
      throw new HttpsError("invalid-argument", "Student mora imati izabranu autoškolu i instruktora.");
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

    // Kreiranje invite-a sa svim podacima
    const inviteDataToSave: any = {
      email,
      role,
      token,
      used: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid,
      createdAtHuman: new Date().toISOString(),
      autoSkolaId: autoSkolaId || null,
      instruktorId: instruktorId || null,
      fullName: imePrezime || null,  // <-- SAČUVAJ KAO fullName (ili imePrezime)
      godine: godine || null,
    };

    const inviteRef = await db.collection("invites").add(inviteDataToSave);
    console.log("Invite kreiran sa ID:", inviteRef.id);

    // Generisanje linka (promeni URL za produkciju)
    const baseUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3000" 
      : "https://autoskolasampion.com"; // Zameni sa tvojim produkcija domenom

    const inviteLink = `${baseUrl}/register?token=${token}`;

    // VRATI SVE PODATKE u odgovoru
    return {
      success: true,
      inviteLink,
      inviteId: inviteRef.id,
      email,
      role,
      expiresAt: expiresAt.toDate().toISOString(),
      autoSkolaId: inviteDataToSave.autoSkolaId,
      instruktorId: inviteDataToSave.instruktorId,
      imePrezime: inviteDataToSave.fullName,  // <-- VRATI IME
      godine: inviteDataToSave.godine,
    };

  } catch (error) {
    console.error("Greška u createInvite funkciji:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Došlo je do interne greške. Pokušajte ponovo.");
  }
});