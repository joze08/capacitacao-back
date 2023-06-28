import express from 'express';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';

import swaggerDocs from './swagger.json';

import { Auth, Posts } from '@/app/controllers'

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/auth', Auth);
app.use('/post', Posts);

app.listen(PORT, () => {
  console.log("Aplicação rodando na porta 3000");
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));