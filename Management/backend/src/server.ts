import 'dotenv/config';
import app from './app';
import cron from 'node-cron';
import { checkPaymentDeadlines } from './services/payment.service';

const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`Management API running on port ${PORT}`);
});

// Check payment deadlines every day at 09:00
cron.schedule('0 9 * * *', async () => {
  await checkPaymentDeadlines();
});
