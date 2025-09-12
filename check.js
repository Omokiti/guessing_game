import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

// Utility: Generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit string
}

// Utility: Expiry time (5 minutes)
function getExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000);
}

// ------------------- SIGNUP -------------------
export const signup = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (unverified)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        verified: false,
      },
    });

    // Generate OTP
    const otp = generateOtp();
    await prisma.userOTP.create({
      data: {
        token: otp,
        expiresAt: getExpiry(),
        userId: user.id,
      },
    });

    // TODO: send OTP via email (use nodemailer, Twilio, etc.)
    console.log(`OTP for ${email}: ${otp}`);

    return res.status(201).json({
      message: "User created. Please verify OTP sent to email.",
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Signup failed" });
  }
};

// ------------------- VERIFY OTP -------------------

const verifyOtpUser = async (req, res) => {
    const { email, otp } = req.body;
  
    try {
      // find OTP record
      const otpRecord = await prisma.userOTP.findFirst({
        where: {
          email,
          token: otp,
          verified: false,
          expiresAt: { gt: new Date() }, // not expired
        },
      });
  
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
  
      // mark user as verified
      await prisma.user.update({
        where: { email },
        data: { isVerified: true },
      });
  
      // mark OTP as used
      await prisma.userOTP.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });
  
      return res.status(200).json({ message: "User verified successfully" });
    } catch (err) {
      console.error("OTP Verification Error:", err);
      return res.status(500).json({ error: "OTP verification failed" });
    }
  };
  
  export const createRecipe = async (req, res) => {
    const { title, description, ingredients, steps, prepTime } = req.body;
    const userId = req.userId; // set from JWT middleware
  
    try {
      const recipe = await prisma.recipe.create({
        data: {
          title,
          description,
          ingredients,
          steps,
          prepTime: Number(prepTime),
          author: { connect: { id: userId } },
        },
      });
  
      res.status(201).json(recipe);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  export const getRecipes = async (req, res) => {
    try {
      const recipes = await prisma.recipe.findMany({
        include: {
          author: { select: { id: true, username: true } },
          comments: true,
          likes: true,
        },
      });
      res.json(recipes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  export const likeRecipe = async (req, res) => {
    const { recipeId } = req.params;
    const userId = req.userId;
  
    try {
      const like = await prisma.like.create({
        data: {
          recipe: { connect: { id: Number(recipeId) } },
          user: { connect: { id: userId } },
        },
      });
  
      res.json({ message: "Recipe liked", like });
    } catch (err) {
      if (err.code === "P2002") {
        res.status(400).json({ error: "You already liked this recipe" });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  };

  
  export const addComment = async (req, res) => {
    const { recipeId } = req.params;
    const { content } = req.body;
    const userId = req.userId;
  
    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          author: { connect: { id: userId } },
          recipe: { connect: { id: Number(recipeId) } },
        },
      });
  
      res.status(201).json(comment);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  export const updateRecipe = async (req, res) => {
    const { recipeId } = req.params;
    const { title, description, ingredients, steps, prepTime } = req.body;
    const userId = req.userId;
  
    try {
      // Ensure only author can update
      const recipe = await prisma.recipe.findUnique({ where: { id: Number(recipeId) } });
      if (!recipe || recipe.authorId !== userId) {
        return res.status(403).json({ error: "Not allowed" });
      }
  
      const updated = await prisma.recipe.update({
        where: { id: Number(recipeId) },
        data: { title, description, ingredients, steps, prepTime },
      });
  
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  