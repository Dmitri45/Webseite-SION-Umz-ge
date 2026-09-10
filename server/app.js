import express from 'express';
import { config } from './config/env.js';
import contactRouter from './routes/contact.routes.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

// Keep documents fresh; allow browsers to reuse images, CSS and JavaScript.
for (const directory of ['assets', 'img', 'css', 'js']) {
  app.use(`/${directory}`, express.static(`${config.publicRoot}${directory}`, { maxAge: '1d' }));
}

app.get('/index.html', (req, res) => {
  const query = req.originalUrl.slice(req.path.length);
  res.redirect(301, `/${query}`);
});

// Only publish website files, not the backend source or project metadata.
for (const filename of ['index.html', 'impressum.html', 'datenschutz.html', 'robots.txt', 'sitemap.xml']) {
  const route = filename === 'index.html' ? '/' : `/${filename}`;
  app.get(route, (req, res) => res.sendFile(filename, { root: config.publicRoot }));
}
app.use('/api/contact', contactRouter);
app.use(errorHandler);

export default app;
