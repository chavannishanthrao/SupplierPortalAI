import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { nanoid } from "nanoid";

// Configure local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (user.authType !== "local") {
          return done(null, false, { message: "Please use the appropriate login method" });
        }

        const isValid = await bcrypt.compare(password, user.password || "");
        
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, { id: user.id, email: user.email, authType: "local" });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Helper functions
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function createLocalUser(email: string, password: string, firstName?: string, lastName?: string) {
  const hashedPassword = await hashPassword(password);
  const userId = nanoid();
  
  return storage.upsertUser({
    id: userId,
    email,
    password: hashedPassword,
    firstName: firstName || null,
    lastName: lastName || null,
    authType: "local",
  });
}

export function isLocalAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.authType === "local") {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function isAnyAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}