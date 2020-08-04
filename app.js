const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const errorsController = require('./controllers/error');
const User = require('./models/user');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf =  require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const MONGODB_URI = require('./keys').mongodburi;

const app = express();  
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})
const csrfProtection = csrf();  

const fileStorage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,'images');
    },
    filename: (req,file,cb) => {
        cb(null,Math.random()+'-'+file.originalname);
    }
});

const fileFilter = (req,file,cb) => {
    if(file.mimetype==='image/png'||file.mimetype==='image/jpg'||file.mimetype==='image/jpeg'){
        cb(null,true);
    }
    else{
        cb(null,false);
    }
}

app.set('view engine','ejs');
app.set('views','views'); 

app.use(bodyParser.urlencoded({extended:true}));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use(express.static(path.join(__dirname,'public')));
app.use('/images',express.static(path.join(__dirname,'images')));
app.use(session({
    secret:require('./keys')(session_secret),
    resave:false,
    saveUninitialized:false,
    store:store
}));
app.use(csrfProtection);
app.use(flash());

app.use((req,res,next)=>{
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req,res,next)=>{
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
        .then(user=>{
            if(!user){
                next();
            }
            req.user = user;
            next();
        })
        .catch(err=>{
            // console.log(err)
            next(new Error(err));
        });
})


const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const { session_secret } = require('./keys');

app.use('/admin',adminRoutes); 
app.use(shopRoutes);
app.use(authRoutes);     

app.get('/500',errorsController.get500);
app.use(errorsController.get404);

app.use((error,req,res,next)=>{
    res.status(500).render('500',{
        pageTitle:'Error!',
        path:'/500',
        isAuthenticated: req.isLoggedIn
    });
})

mongoose.connect(MONGODB_URI)
    .then(result=>{
        app.listen(3000);
    })
    .catch(err=>{
        console.log(err)
    }); 


