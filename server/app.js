import express from 'express';
import { config } from './config/env.js';
import contactRouter from './routes/contact.routes.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

app.use(express.static(config.publicRoot));
app.use('/api/contact', contactRouter);
app.use(errorHandler);

export default app;
