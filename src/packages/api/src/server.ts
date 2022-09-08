import express from 'express';
import payload from 'payload'

require('dotenv').config();
const app = express();

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin');
});

payload.init({
  secret: process.env.PAYLOAD_SECRET,
  mongoURL: process.env.MONGODB_URI,
  express: app,
  onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
  },
})


export {
    app
}