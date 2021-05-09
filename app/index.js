require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const directory = path.join('public');
const imageFilePath = path.join(directory, 'picsum.jpg');
const lastUpdatedFilePath = path.join(directory, 'lastupdated.txt');
const IMAGE_URL = 'https://picsum.photos/1200';
const TODO_BACKEND_BASEURL = `http://kube-node-service:2346`; // GKE requires the full url with the path.

const todaysFileAlreadyExists = async () =>
  new Promise((res) => {
    // Check if image doesn't exist
    fs.stat(imageFilePath, (err, stats) => {
      if (err || !stats) return res(false);
    });

    const now = new Date();
    const dayOfMonthNow = now.getDate();

    fs.readFile(lastUpdatedFilePath, (err, buffer) => {
      // Edge case --> 1 month forward match, so unlikely that I count this as sufficient enough
      const isUpdatedToday =
        buffer && buffer.toString() === dayOfMonthNow.toString();
      if (err || !isUpdatedToday) return res(false);
      return res(true);
    });
  });

const findAFile = async () => {
  if (await todaysFileAlreadyExists()) return;

  await new Promise((res) => fs.mkdir(directory, (err) => res()));

  const response = await axios.get(IMAGE_URL, { responseType: 'stream' });
  response.data.pipe(fs.createWriteStream(imageFilePath));

  const onCreateTime = new Date();
  const dayOfMonth = onCreateTime.getDate();

  fs.writeFile(lastUpdatedFilePath, dayOfMonth.toString(), (err) => {
    if (err) {
      console.log('failed to write a date', error);
    } else {
      console.log('new date added');
    }
  });
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.set('view engine', 'pug');
app.use(express.static('public'));

app.use((req, _res, next) => {
  console.log('--- GATEWAY REQUEST ---');
  console.log(`Method ${req.method} /// Path ${req.path}`);
  console.log('BODY', req.body);
  next();
});

app.get('/', async (_req, res) => {
  try {
    await findAFile();
    const response = await axios.get(TODO_BACKEND_BASEURL);
    res.status(200).render('index', { todos: response.data.list });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.post('/new', async (req, res) => {
  try {
    const { todo } = req.body;
    await axios.post(TODO_BACKEND_BASEURL, { todo: todo });
    res.redirect('/');
  } catch (error) {
    res.send(error.message);
  }
});

app.post('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await axios.put(`${TODO_BACKEND_BASEURL}/${id}`);
    res.redirect('/');
  } catch (error) {
    res.send(error.message);
  }
});

// Ready when it can receive data from pingpong application
app.get('/healthz', async (_req, res) => {
  try {
    await axios.get(TODO_BACKEND_BASEURL);
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('namespace env', process.env.DEPLOYMENT_POD_NAMESPACE);
  console.log(`Server running on port ${PORT} (project-gateway)`);
});
