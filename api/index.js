const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const {authRouter} = require('./auth');
const {scheduleRouter} = require('./schedule');
const {calendarRouter} = require('./calendar');
const {more} = require('./more');

const app = express();

app.use(morgan('dev'));
app.use(express.json()); // postman - raw, json
app.use(express.urlencoded({extended: true})); // postman - x-www-form-urlencoded
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN);
    res.header('Access-Control-Allow-Credentials', true);
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    next();
  });

app.get('/api/', (req, res) => {
    res.status(200).json({message: "Hello world!"});
});

app.use('/api/static', express.static('files/public'))
app.use('/api/auth', authRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/files', more)

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
});