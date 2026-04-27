const fs = require('fs');
const path = require('path');

const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env')
];

for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    require('dotenv').config({ path: candidate });
    break;
  }
}

const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  pythonExecutable: process.env.PYTHON_EXECUTABLE || 'python'
};

module.exports = { env };
