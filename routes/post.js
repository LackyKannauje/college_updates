const express = require("express");
const authUser = require("../middleware/auth");
const router = express.Router();
const {
  handlePostUploadFileReq,
  handlePostEditUploadReq,
  handlePostDeleteReq,
  handleGetAllPosts,
  handleGetPostById,
  handleGetAllPostsByUserId,
  handlePostLikeReq,
  handlePostRemoveLikeReq,
  handlePostCommentReq,
  handleGetCategoryPosts,
  handleDeletePostComment,
} = require("../controllers/post");
const postUpload = require("../config/cloudinaryPost");

router
  .post(
    "/upload",
    authUser,
    postUpload.array("media", 5),
    handlePostUploadFileReq
  )
  .put(
    "/edit/:id",
    authUser,
    postUpload.array("media", 5),
    handlePostEditUploadReq
  )
  .delete("/delete/:id", authUser, handlePostDeleteReq)
  .get("/:id", authUser, handleGetPostById)
  .get("/", authUser, handleGetAllPosts)
  .get("/user/:id", authUser, handleGetAllPostsByUserId)
  .get("/category/:type", authUser, handleGetCategoryPosts)
  .post("/like/:id", authUser, handlePostLikeReq)
  .delete("/like/:id", authUser, handlePostRemoveLikeReq)
  .post("/comment/:id", authUser, handlePostCommentReq)
  .delete("/comment/:id/:commentId", authUser, handleDeletePostComment);

module.exports = router;
