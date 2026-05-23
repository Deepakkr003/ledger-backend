import express from "express";
import authMiddleware from "../Middleware/auth.middleware.js";
import transactionController from "../controller/transaction.controller.js";

const transactionRouter = express.Router();


/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

transactionRouter.post("/", authMiddleware.authMiddleware, transactionController.createTransactionController)


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */


transactionRouter.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)


export default transactionRouter;