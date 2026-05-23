import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema({
  email:{
    type: String,
    required: [true,"Email is required for Creating a user"],
    trim: true,
    lowercase: true,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Invalid Email Address"],
    unique: [true, "Email Already Exists"]
  },
  name: {
    type: String,
    required: [true, "Name is required"],

  },
  password: {
    type: String,
    required: [true,"Password id Required"],
    minlength: [6, "pssword should conatin more than 6 character"],
    select: false
  },
  systemUser:{
    type: Boolean,
    default: false,
    immutable: true,
    select: false
  }
},{
  timestamps: true
})

userSchema.pre("save", async function () {

  if(!this.isModified("password")){
    return 
  }

  const hash = await bcrypt.hash(this.password, 10)
  this.password = hash

  return
  
})

userSchema.methods.comparePassword = async function (password) {
  
  return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user", userSchema)

export default userModel

