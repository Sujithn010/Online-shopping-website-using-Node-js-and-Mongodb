const bcrypt = require('bcryptjs');
const User = require('../models/user');
const crypto = require('crypto');
const {validationResult} = require('express-validator/check');

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email:'',
      password:''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email:email,
        password:password
      },
      validationErrors: errors.array()
    });
  }
  User.findOne({email:email})
    .then(user => {
      if(!user){
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Email does not exist',
          oldInput: {
            email:email,
            password:password
          }
        });
      }
      bcrypt.compare(password,user.password)
        .then(doMatch=>{  
          if(doMatch){
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err=>{
                console.log(err);
                res.redirect('/');
            });
          }
          req.flash('error','Invalid email or password');
          res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password',
            oldInput: {
              email:email,
              password:password
            }
          });
        })
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email:'',
      password:'',
      confirmPassword: ''
    },
    validationErrors: []
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  // console.log(errors.array());
  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email:email,
        password:password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  User.findOne({email:email})
    .then(userDoc=>{
      if(userDoc){
        req.flash('error','Email already exists');
        return res.redirect('/signup');
      }
    bcrypt.hash(password,12)
      .then(hashedPassword=>{
        const user = new User({
          email:email,
          password:hashedPassword,
          cart: {items: []}
        });
          return user.save();
      })
      .then(result=>{
        console.log('New user Signed Up');
        res.redirect('/login');
      })
      .catch(err=>console.log(err));
    })
}     

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log("Err2");
    res.redirect('/');
  });
};

exports.getReset = (req,res,next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
}

exports.postReset = (req,res,next) => {
  crypto.randomBytes(32,(err,buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email:req.body.email})
      .then(user=>{
        if(!user){
          req.flash('error','Email does not exist');
          return res.redirect('/reset'); 
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        user.save()
        .then(result=>{
          res.redirect('/');
        })
        .catch(err => {
          const error = new  Error(err);
          error.httpStatusCode = 500;
          next(error);
        });;
      })
    })
}

exports.getNewPassword = (req,res,next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  const token = req.params.token;
  User.findOne({resetToken:token,resetTokenExpiration:  {$gt:Date.now()}})
    .then(user=>{
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new  Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
}

exports.postNewPassword = (req,res,next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken:passwordToken,
    _id:userId,
    resetTokenExpiration: {$gt: Date.now()}
  })
  .then(user=>{
    resetUser = user;
    if(newPassword!==confirmPassword){
      req.flash('error','Passwords do not match');
      return res.redirect('/login');
    }
    bcrypt.hash(newPassword,12)
    .then(hashedPassword=>{
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result=>{
      console.log('Password Changed');
      res.redirect('/login');
    })
  })
  .catch(err => {
    const error = new  Error(err);
    error.httpStatusCode = 500;
    next(error);
  });
}