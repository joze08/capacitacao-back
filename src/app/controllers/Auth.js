import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '@/app/schemas/User';
import authConfig from '@/config/auth';
import Mailer from '@/modules/Mailer';

const router = new Router();

const generateToken = params => {
  return jwt.sign(params, authConfig.secret, { expiresIn: 86400 });
}

router.post('/register', (req, res) => {
  const { email, name, password } = req.body;

  User.findOne({ email }).then((userData) => {
    if (userData) {
      return res.status(400).send({ error: 'User already exists' });
    } else {
      User.create({ name, email, password }).then(user => {
        return res.send(user);
      }).catch(error => {
        console.error(`Error saving user: ${error}`)
        return res.status(400).send({ error: 'Registration failed' })
      })
    }
  }).catch(error => {
    console.error(`Error consulting user: ${error}`)
    return res.status(400).send({ error: 'Registration failed' })
  })
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email }).select('+password').then(userData => {
    if (userData) {
      bcrypt.compare(password, userData.password).then(result => {
        if (result) {
          const token = generateToken({ uid: userData.id });
          return res.send({ token: token, tokenExpiration: '1d' });
        } else {
          return res.status(401).send({ error: 'Invalid password' });
        }
      }).catch(error => {
        console.error(`Error verify password ${error}`);
        return res.status(401).send({ error: 'Invalid password' });
      });
    }
  }).catch(error => {
    console.error(`Error login the user: ${error}`);
    return res.status(400).send({ error: 'Some error in login' });
  });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  User.findOne({ email }).then(userData => {
    if (userData) {
      const token = crypto.randomBytes(20).toString('hex');
      const expiration = new Date();
      expiration.setHours(new Date().getHours() + 3);

      User.findByIdAndUpdate(userData.id, {
        $set: {
          passwordResetToken: token,
          passwordResetTokenExpiration: expiration
        }
      }).then(() => {
        Mailer.sendMail({
          to: email,
          from: 'webmaster@testexpress.com',
          template: 'auth/forgot_password',
          context: { token }
        }, error => {
          if (error) {
            console.error(`Error sending email: ${error}`);
            return res.status(400).send({ error: 'Erro ao enviar email' });
          } else {
            return res.send();
          }
        })
      }).catch(error => {
        console.error(`Error saving recovery token: ${error}`);
        return res.status(500).send();
      })
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  }).catch(error => {
    console.error(`Error, no forgot password: ${error}`);
    return res.status(400).send({ error: 'Some error in login' });
  })
});

router.post('/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;

  User.findOne({ email })
    .select('+passwordResetToken passwordResetTokenExpiration')
    .then(userData => {
      if (userData) {
        if (token != userData.passwordResetToken || new Date().now > userData.passwordResetTokenExpiration) {
          return res.status(400).send({ error: 'Invalid token' })
        } else {
          userData.passwordResetToken = undefined;
          userData.passwordResetTokenExpiration = undefined;
          userData.password = newPassword;

          userData.save().then(() => {
            return res.send({ message: 'Senha trocada com sucesso' });
          }).catch(error => {
            console.error('Erro ao salvar nova senha do usuário', error);
            return res.status(500).send({ error: 'Internal server error' })
          });
        }
      } else {
        return res.status(404).send({ error: 'User not found' });
      }
    }).catch(error => {
      console.error('Erro no forgot password: ' + error);
      return res.status(400).send({ error: 'Some error in login' });
    })
});

export default router;