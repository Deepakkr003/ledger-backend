import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken"



async function authMiddleware(req, res, next) {

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing"
    })
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized"
      })
    } else {
      req.user = user
      next()
    }

  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized access, token is Invalid"
    })
  }
}

async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing"
    })
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.userId).select("+systemUser")

    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access, only system users can perform this action"
      })
    }
      req.user = user
      return next()

  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized access, token is Invalid"
    })
  }
}

export default {authMiddleware, authSystemUserMiddleware}