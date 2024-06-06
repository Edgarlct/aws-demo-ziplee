const fastify = require('fastify')({ logger: true });
const mysql = require('mysql2/promise');
const AWS = require('@aws-sdk/client-s3');
require('dotenv').config();

// MySQL connection URI from environment variables
const dbUri = process.env.MYSQL_URI;

// AWS S3 configuration from environment variables
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Endpoint to create MySQL database and insert 1 item
fastify.post('/create-database', async (request, reply) => {
  try {
    const connection = await mysql.createConnection(dbUri);
    await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
    await connection.query('USE testdb');
    await connection.query('CREATE TABLE IF NOT EXISTS items (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))');
    await connection.query('INSERT INTO items (name) VALUES (?)', ['item1']);
    connection.end();
    reply.send({ message: 'Database and item created successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
});

// Endpoint to upload an object to S3 bucket
fastify.post('/upload-s3', async (request, reply) => {
  const { Key, Body } = request.body; // Expecting JSON with `Key` and `Body`

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key,
    Body
  };

  try {
    await s3.upload(params).promise();
    reply.send({ message: 'Object uploaded successfully' });
  } catch (err) {
    reply.status(500).send({ error: err.message });
  }
});

// Endpoint to ping API and get response pong
fastify.get('/ping', async (request, reply) => {
  reply.send({ message: 'pong' });
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(process.env.PORT || 3000);
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
