import ledgerModel from "../models/ledger.model.js";
import transactionModel from "../models/transaction.model.js";
import emailService from "../services/email.service.js";
import accountModel from "../models/account.model.js";
import mongoose from "mongoose";



async function createTransactionController(req, res) {

  /**
   * 1. Validate request body
   */
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "All fields are required"
    })
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount
  })

  const toUserAccount = await accountModel.findOne({
    _id: toAccount
  })

  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message: "Invalid fromaccount or toaccount"
    })
  }


  /**
   * 2. Validate idempotency key
   */

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey
  })

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already processed",
        transaction: isTransactionAlreadyExists
      })
    }
    if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is being processed"
      })
    }
    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Previous transaction attempt failed, please retry"
      })
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "Previous transaction was reversed, please retry"
      })
    }
  }


  /**
   * 3. Check account status
   */

  if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
    return res.status(400).json({
      message: "Both fromAccount and toAccount must be active to process transaction"
    })
  }

  /**
   * 4. Drive sender balance from ledger
   */

  const balance = await fromUserAccount.getBalance()

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}. Required balance is ${amount}`
    })
  }

  /**
   * 5. Create transaction {PENDING}
   */

  const session = await mongoose.startSession()
  session.startTransaction()

  const transaction = new transactionModel({
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING"
  })

  const debitLedgerEntry = await ledgerModel.create([{
    account: fromAccount,
    amount,
    transaction: transaction._id,
    type: "DEBIT"
  }], { session })

  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    amount,
    transaction: transaction._id,
    type: "CREDIT"
  }], { session })

  transaction.status = "COMPLETED"
  await transaction.save({ session })

  await session.commitTransaction()
  session.endSession()


  /**
   * 10. Send email notification
   */

  await emailService.sendTransactionEmail(req.user.email , req.user.name, amount, fromUserAccount._id, toUserAccount._id)

  res.status(201).json({
    message: "Transaction successful",
    transaction: transaction
  })

}

async function createInitialFundsTransaction(req, res) {

  const { toAccount, amount, idempotencyKey } = req.body

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "All fields are required"
    })
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount
  })

  if (!toUserAccount) {
    return res.status(404).json({
      message: "Invalid toAccount"
    })
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id
  })

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System account not found for user"
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING"
  })


  const debitLedgerEntry = await ledgerModel.create([{
    account: fromUserAccount._id,
    amount,
    transaction: transaction._id,
    type: "DEBIT"
  }], { session })


  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    amount,
    transaction: transaction._id,
    type: "CREDIT"
  }], { session })


  transaction.status = "COMPLETED"
  await transaction.save({ session })
  await session.commitTransaction()
  session.endSession()

  res.status(201).json({
    message: "Initial funds added successfully",
    transaction: transaction
  })
}

export default {
  createTransactionController,
  createInitialFundsTransaction
}