import express from 'express';
import { Task } from '../models/task.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// --------------------------------
// --------- TASK-ROUTES ----------
// --------------------------------
router.get('/tasks', auth, async (req, res) => {
  let query = { owner: req.user._id };
  let sort = {};
  if (req.query.completed) {
    query = { owner: req.user._id, completed: req.query.completed };
  }

  if (req.query.sortBy) {
    const elements = req.query.sortBy.split(':');
    sort = { [elements[0]]: elements[1] === 'desc' ? -1 : 1 };
  }
  try {
    const tasks = await Task.find(query, null, {
      limit: req.query.limit,
      skip: req.query.skip,
      sort,
    });

    res.status(200).send(tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).send('No task found');
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/tasks/:id', auth, async (req, res) => {
  const requestKeys = Object.keys(req.body);
  const allowedKeys = ['description', 'completed'];
  const isAllowedKey = requestKeys.every((key) => allowedKeys.includes(key));

  if (!isAllowedKey) {
    return res.status(404).send('unable to update, one of your keys does not exist');
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

    if (!task) {
      return res.status(404).send('No task found');
    }
    task.set(req.body);
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(501).send(e);
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send('No task found');
    }
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
