import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log("accessToken===>", accessToken);

    if (!accessToken) throw new ApiError(401, "Unauthorized request");
    const decodeToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    console.log("decodeToken===>", decodeToken);

    const user = await User.findById(decodeToken?._id).select(
      "-passowrd -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid access token");
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export { verifyJWT };
