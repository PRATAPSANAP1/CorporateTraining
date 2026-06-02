const dotenv = require('dotenv');
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('\n=========================================');
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined!');
  console.error('Please create a .env file and configure JWT_SECRET.');
  console.error('=========================================\n');
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mce-placement-portal',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  judge0ApiKey: process.env.JUDGE0_API_KEY || '',
  judge0ApiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
  resendApiKey: process.env.RESEND_API_KEY || '',
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
};

