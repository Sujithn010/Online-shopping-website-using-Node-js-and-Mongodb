const express = require('express');
const path = require('path');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');
const router = express.Router();
const {check,body} = require('express-validator');

router.get('/add-product',isAuth, adminController.getAddProduct);

router.get('/products',isAuth,adminController.getProducts);

router.get('/edit-product/:productId',isAuth,adminController.getEditProduct);

router.post('/add-product',
    [
        body('title')
            .isString()
            .isLength({min:3})
            .trim(),
        // body('imageUrl').isURL(),
        body('price')
        .isFloat()
        .trim(),
        body('description')   
        .isLength({min:5,max:200})
    ],
    isAuth,adminController.postAddProduct);

router.post('/edit-product',   
[
    body('title')
        .isString()
        .isLength({min:3})
        .trim(),
    // body('imageUrl').isURL(), 
    body('price')
    .isFloat()
    .trim(),
    body('description')
    .isLength({min:5,max:200})
],
isAuth,adminController.postEditProduct);


router.delete('/product/:productId',isAuth,adminController.deleteProduct);

 
module.exports = router;
