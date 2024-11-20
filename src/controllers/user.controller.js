import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidEmail, isValidPassword } from "../utils/validation.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.service.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  let avatarImage;
  if ([username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email.");
  }
  if (!isValidPassword(password)) {
    throw new ApiError(
      400,
      "Password length should be equal or greator then 8."
    );
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser !== null)
    throw new ApiError(409, "Username or email already taken");

  const avatarFile = req.files?.avatar?.[0]?.path;

  if (avatarFile) {
    avatarImage = await uploadOnCloudinary(avatarFile);
  }

  const user = await User.create({
    username,
    avatar: avatarImage?.url || "",
    password,
    email,
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!userCreated) throw new ApiError(409, "User not created");

  return res
    .status(200)
    .json(new ApiResponse(200, userCreated, "User created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email))
    throw new ApiError(400, "username or email is required.");
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "User doesn't exit");
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new ApiError("400", "Password is incorrect");
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  console.log("accessToken===>", { accessToken, refreshToken });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  await User.findByIdAndUpdate(userId, {
    $set: {
      refreshToken: undefined,
    },
  });
  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const generateNewAccessToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) throw new ApiError("401", "UnAuthorized request");

  try {
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");
    if (user?.refreshToken !== decodedToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const { accessToken, refreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .clearCookie("accessToken", accessToken, options)
      .clearCookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { refreshToken, accessToken },
          "Token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, generateNewAccessToken };
