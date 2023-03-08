import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Task } from './task.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: [0, 'must be positive number'] },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      validate(email) {
        if (!validator.isEmail(email)) {
          throw new Error('invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
      trim: true,
      validate(val) {
        if (val.toLowerCase().includes('password')) {
          throw new Error('do not use password as your password ');
        }
      },
    },
    avatar: { type: Buffer },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    token: String,
  },

  {
    timestamps: true,
  }
);

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, process.env.AUTH_SECRET);
  user.tokens = user.tokens.concat({ token });

  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async function (email, password) {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('unable to login');
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new Error('unable to login');
  }
  return user;
};

userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

userSchema.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  const updatedDoc = this.getUpdate();

  if (updatedDoc.password) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(updatedDoc.password, salt);
    updatedDoc.password = hash;
  }

  const new_object = {
    ...docToUpdate._doc,
    ...updatedDoc,
    updatedAt: { $set: new Date() },
  };
  console.log(new_object);
  this.updateOne({}, { $set: new_object });
  next();
});

userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model('User', userSchema);

export { User };
