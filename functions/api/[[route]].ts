import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { api } from '../../src/server/api';

const app = new Hono();
app.route('/api', api);

export const onRequest = handle(app);

