import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    const user = await User.findOne({ _id: decoded, 'tokens.token': token });

    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error, msg: 'unable to authenticate' });
  }
};
