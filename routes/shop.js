const express = require('express');
const path = require('path');
// const rootDir = require('../util/path');
const router = express.Router();
// const adminData = require('./admin');
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');
router.get('/',shopController.getIndex);

router.get('/products',shopController.getProducts);

router.get('/products/:productId',shopController.getProduct);

router.get('/cart',isAuth, shopController.getCart);

router.post('/cart',shopController.postCart);

router.post('/cart-delete-item',shopController.postCartDeleteProduct);

// router.post('/create-order',shopController.postOrder);

router.get('/checkout/success',shopController.getCheckoutSuccess);

router.get('/checkout/cancel',shopController.getOrders);

router.get('/orders',isAuth,shopController.getOrders);

// router.get('/checkout',shopController.getCheckout);

router.get('/orders/:orderId',isAuth,shopController.getInvoice);

router.get('/checkout',isAuth,shopController.getCheckout);


module.exports = router;