import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER
export async function registerUser(req, res) {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role?.toLowerCase() || "student"
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    // res.status(201).json({
    //   message: "Registered successfully",
    //   user
    // });

    res.status(201).json({
  message: "Registered successfully",
  token,
  role: user.role,
  user
});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// LOGIN
export async function loginUser(req, res) {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Please provide email/username and password"
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid email/username or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

  res.cookie("token", token, {
  httpOnly: true,
  sameSite: "none",
  secure: false
});

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// GET PROFILE
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}