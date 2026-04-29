import jwt from "jsonwebtoken";

export const 
IdentiyUser = (req, res, next) => {


  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json("No token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.log("JWT error:", err.message);
    return res.status(401).json("Invalid token");
  }
};