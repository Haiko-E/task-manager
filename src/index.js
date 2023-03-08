import express from 'express';
import { connectToMongo } from './db/mongoose.js';
import taskRouter from './routes/task.js';
import userRouter from './routes/user.js';

await connectToMongo();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
