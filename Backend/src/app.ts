import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import './models';

const app = express();

app.use(cors());

// Stripe signature verification needs the unparsed body, so this route is
// mounted with express.raw BEFORE the global JSON parser.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
