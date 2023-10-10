// const express = require('express');
import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import {authRouter} from './auth';
import {scheduleRouter} from './schedule';
import {calendarRouter} from './calendar';
import {more} from './more';
import { verifyToken } from './auth';
import { groupsRouter, getGroup } from './groups';

const app = express();
app.use(morgan('dev'));
app.use(express.json()); // postman - raw, json
app.use(express.urlencoded({extended: true})); // postman - x-www-form-urlencoded
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOW_ORIGIN)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
  if (req.method === 'OPTIONS') res.sendStatus(200)
  else next()
});

app.get('/api/', (req, res) => {
    res.status(200).json({message: "Hello world!"});
});

app.use('/api/static', express.static('files/public'))
app.use('/api/auth', authRouter);
app.use('/api/groups', verifyToken, groupsRouter) // NEED VALIDATION
app.use('/api/schedule', verifyToken, scheduleRouter);
app.use('/api/calendar', verifyToken, getGroup, calendarRouter);
app.use('/api/files', verifyToken, getGroup, more)

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
});