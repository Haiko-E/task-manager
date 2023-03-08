import express from 'express';
import { User } from '../models/user.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import sharp from 'sharp';
import { sendWelcomeEmail } from '../email/accounts.js';

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 600000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('file must be a in valid picture format (jpg, jpeg or png)'));
    }

    cb(null, true);

    // cb(new Error('file must be a doc'))
    // cb(null, true)
    // cb(null,false)
  },
});

// --------------------------------
// --------- USER-ROUTES ----------
// --------------------------------
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(201).send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('No user found');
    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/users/:id/avatar', auth, async (req, res) => {
  try {
    console.log(req.user.name);
    if (!req.user || !req.user.avatar) {
      throw new Error('no user or user avatar found');
    }

    res.set('Content-Type', 'image/jpg');
    res.send();
  } catch (e) {
    res.status(404).send(e);
  }
});

router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    const token = await user.generateAuthToken();
    await user.save();
    res.status(201).send({ user, token });
    await sendWelcomeEmail(req.body.email, req.body.name);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.post(
  '/users/me/avatar',
  auth,
  upload.single('upload'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer);
    // req.user.avatar = req.file.buffer;

    await req.user.save();

    try {
      res.send('avatar uploaded');
    } catch (error) {
      res.status(400).send(error.message);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);

    await req.user.save();

    res.send('logged out');
  } catch (error) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    req.user.token = '';
    await req.user.save();

    res.send('logged out');
  } catch (error) {
    res.status(500).send();
  }
});

router.patch('/users/me', auth, async (req, res) => {
  const requestKeys = Object.keys(req.body);
  const allowedKeys = ['name', 'age', 'email', 'password'];
  const isAllowedKey = requestKeys.every((key) =>
    allowedKeys.find((allowedKey) => key === allowedKey)
  );

  if (!isAllowedKey) {
    return res.status(404).send('unable to update, one of your keys does not exist');
  }

  try {
    const user = await User.findOneAndUpdate({ _id: req.user._id }, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete('/users/me', auth, async (req, res) => {
  try {
    // if (!user) {
    //   return res.status(404).send('No user found');
    // }

    await req.user.deleteOne();
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  try {
    req.user.avatar = null;
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
