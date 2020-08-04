const express = require('express');
const {check,body} = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', 
    check('email')
        .isEmail()
        .withMessage('Invalid email')
        .normalizeEmail(),
authController.postLogin);

router.post(
    '/signup',
    [
      check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .normalizeEmail(),
      body(
        'password',
        'Please enter a password with only numbers and text and at least 5 characters.'
      )
        .trim()
        .isLength({ min: 5 })
        .isAlphanumeric(),
      body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      })
    ],
    authController.postSignup
  );

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password',authController.postNewPassword);

module.exports = router;