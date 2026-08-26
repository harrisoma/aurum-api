const jwt = require('jsonwebtoken');

const secret = 'super-secret-jwt-token-with-at-least-32-characters-long-key';
const userId = 'd31f2432-b3e7-449c-bbe5-ef86f681d094'; // harrisoma@yahoo.com

const token = jwt.sign({
  sub: userId,
  email: 'harrisoma@yahoo.com',
  aud: 'authenticated',
  role: 'authenticated',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
}, secret);

console.log(token);
