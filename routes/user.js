const { response } = require('express');
const e = require('express');
var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const verifyLogin=(req, res, next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  let user=req.session.user
  console.log(user);
  productHelpers.getAllProducts().then((products) => {
    res.render('index', { products, user_head: true, user });
  })
});

router.get('/view-products', function(req, res, next){
  let user = req.session.user
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products', {products, user_head:true, user});
  })
})

router.get('/login',(req, res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{"loginErr":req.session.loginErr})
    req.session.loginErr=false
  }
})

router.get('/signup',(req, res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/signup')
    req.session.loginErr=false
  }
})

router.post('/signup',(req, res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')
  })
})
router.post('/login',(req, res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr=true
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/user/wishlist', verifyLogin,(req, res)=>{
  res.render('user/wishlist')
})

router.get('/cart',verifyLogin, async(req, res)=>{
  let products =await userHelpers.getCartProducts(req.session.user._id)
  console.log(products);
  res.render('user/cart', {products, user_head:true})
})

router.get('/add-to-cart/:id',verifyLogin, (req, res)=>{
  userHelpers.addToCart(req.params.id, req.session.user._id).then(()=>{
    res.redirect('/')
  })
})

module.exports = router;
