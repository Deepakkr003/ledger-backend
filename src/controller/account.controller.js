import accountModel from "../models/account.model.js"

async function createAccountController(req, res) {
  const user = req.user

  const account = await accountModel.create({
    user: user._id
  })

  res.status(201).json(
    account
  )
}

async function getUserAccountController(req, res) {


  const accounts = await accountModel.find({
    user: req.user._id
  })


  res.status(200).json(
    accounts
  )
}

async function getAllAccountsController(req, res) {

  const accounts = await accountModel.find()
    .populate("user", "name email");

  const accountsWithBalance = await Promise.all(

    accounts.map(async (account) => {

      const balance = await account.getBalance();

      return {
        ...account.toObject(),
        balance
      };
    })

  );

  res.status(200).json(accountsWithBalance);
}

async function getAccountBalanceController(req, res) {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}

async function updateAccountStatusController(req, res) {

  const { accountId } = req.params;
  const { status } = req.body;

  const allowedStatus = ["ACTIVE", "FROZEN", "CLOSED"]

  if(!allowedStatus.includes(status)) {
    return res.status(400).json({
      message: "Invalid Status"
    })
  }

  const account = await accountModel.findByIdAndUpdate(
    accountId,
    { status },
    { new: true }
  )

  if (!account) {
    return res.status(404).json({
      message: "Account not found"
    })
  }

  return res.status(200).json(
    {
      message: `Account status updated to ${status}`,
      account
    }
  )
}

export default {
  createAccountController, getUserAccountController, getAccountBalanceController, getAllAccountsController, updateAccountStatusController
}