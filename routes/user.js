const { check } = require("express-validator");
const {
  handleUserLogin,
  handleUserRegistration,
  handleUserLogout,
  handleUserDoFollowing,
  handleUserFollowerList,
  handleUserUnFollow,
  handleUserDeleteAccount,
  handleUsersSearching,
  handleUserViewById,
  handleUserEditProfileInfo,
  handleUserFollowingList,
} = require("../controllers/user");
const express = require("express");
const authUser = require("../middleware/auth");
const upload = require("../config/cloudinary");

const router = express.Router();

const registerValidation = [
  check("username", "Username is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password must be 6 or more characters").isLength({
    min: 6,
  }),
];

const loginValidation = [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
];

//public

router.post("/register", registerValidation, handleUserRegistration);

router.post("/login", loginValidation, handleUserLogin);

router.post("/logout", authUser, handleUserLogout);

router.delete("/delete", authUser, handleUserDeleteAccount);

//private non-editable

router.get("/:id", authUser, handleUserViewById);

router.get("/search/:username", authUser, handleUsersSearching);

router.get("/:id/followers", authUser, handleUserFollowerList);

router.get("/:id/following", authUser, handleUserFollowingList);
//private editable

router
  .post("/follow/:id", authUser, handleUserDoFollowing)
  .post("/unfollow/:id", authUser, handleUserUnFollow);

router.put("/profile", authUser, upload.single("profilePicture") ,handleUserEditProfileInfo);

module.exports = router;
