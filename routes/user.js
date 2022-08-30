const { response } = require("express");
const e = require("express");
var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const paypal = require("paypal-rest-sdk");
const verifyLogin = async (req, res, next) => {
  if (req.session.userLoggedIn) {
    {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  let products = await productHelpers.getAllProducts();
  let category = await categoryHelpers.getAllCategory();
  res.render("index", { products, category, user_head: true, user, cartCount });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
});
router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    // if (response.err) {
    //   req.session.loginErr = response.err;
    //   res.redirect("/login");
    // } else {
    if (response.status) {
      req.session.userLoggedIn = true;
      req.session.user = response.user;
      console.log(response.status);
      res.redirect("/");
    } else {
      req.session.loginErr = response.err;
      res.redirect("/login");
    }
    // }
  });
});

router.get("/signup", (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect("/");
  } else {
    res.render("user/signup", {
      SignErr: req.session.signErr,
      otpErr: req.session.otpErr,
    });
    req.session.otpErr = false;
  }
});

router.post("/signup", (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    if (response.err) {
      req.session.signErr = true;
      res.redirect("/signup");
    } else {
      userDetais = response.userData;
      res.render("user/verify-otp");
    }
  });
});

router.post("/verify-otp", (req, res) => {
  userHelpers.signupOtp(req.body, userDetais).then((response) => {
    if (response.err) {
      req.session.user.otpErr = response.err;
      res.redirect("/signup");
    } else {
      req.session.user = response;
      req.session.userLoggedIn = true;
      res.redirect("/");
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.userLoggedIn = false;
  res.redirect("/");
});

router.get("/product-details", (req, res) => {
  res.render("user/product-details", { user_head: true });
});

router.get("/view-products", verifyLogin, async function (req, res, next) {
  let user = req.session.user;
  let products = await productHelpers.getAllProducts();
  let category = await categoryHelpers.getAllCategory();
  res.render("user/view-products", {
    products,
    category,
    user_head: true,
    user,
    cartCount,
  });
});

router.get("/user/wishlist", verifyLogin, (req, res) => {
  res.render("user/wishlist", { user_head: true });
});

// ----------------cart----------------------

router.get("/cart", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let category = await categoryHelpers.getAllCategory();
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id);
  console.log(products);
  res.render("user/cart", {
    products,
    category,
    user_head: true,
    user,
    cartCount,
    totalValue,
  });
});

router.get("/add-to-cart/:id", (req, res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true });
  });
});

router.post("/change-product-quantity", (req, res, next) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

router.post("/remove-product", (req, res) => {
  userHelpers.removeItem(req.body).then((response) => {
    res.json(response);
  });
});

// -----------------coupon and checkout-----------------------

router.post('/apply-coupon', verifyLogin, async (req, res) => {
  try {
    userHelpers.applyCoupon(req.body, req.session.user._id).then((response) => {
      console.log(response);
      if (response.total) {
        req.session.total = parseInt(response.total)
      }
      res.json(response)
    })
  } catch (error) {
    console.log(error);
  }

})

router.get("/place-order", verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  let category = await categoryHelpers.getAllCategory();
  res.render("user/place-order", {
    user_head: true,
    total,
    user: req.session.user,
    cartCount,
    category
  });
});

router.post("/place-order", async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body["payment-method"] === "COD") {
      res.json({ codSuccess: true });
    } else if (req.body["payment-method"] === "PAYPAL") {
      console.log("****************");
      userHelpers.generatePaypal(orderId, totalPrice).then((response) => {
        req.session.orderId = orderId
        console.log('response');
        console.log(response);
        response.paypalSuccess = true;
        res.json(response);
      });
    } else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response);
      });
    }
  });
  console.log(req.body);
});

router.get("/success", async (req, res) => {
  let totalPrice = await userHelpers.getTotalAmount(req.session.user._id);
  await userHelpers.clearCart(req.session.user._id)

  console.log('totalPrice');
  console.log(totalPrice);
  userHelpers.changeStatus(req.session.user._id, req.session.orderId)

  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [
      {
        "amount": {
          "currency": "USD",
          "total": totalPrice,
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      console.log(payment);
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        console.log(JSON.stringify(payment));
        res.redirect("/order-placed");
      }
    }
  );
});

router.get("/order-placed", async (req, res) => {
  let category = await categoryHelpers.getAllCategory();
  await userHelpers.clearCart(req.session.user._id)
  res.render("user/order-placed", {
    user_head: true,
    user: req.session.user,
    category,
    cartCount,
  });
});

// ------------orders-----------------

router.get("/view-orders", verifyLogin, async (req, res) => {
  let category = await categoryHelpers.getAllCategory();
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("user/orders", {
    user_head: true, user: req.session.user, category, cartCount, orders
  });
});

router.get('/cancel-order/:id', (req, res) => {
  let orderId = req.params.id
  console.log(orderId)
  userHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/view-orders')
  })
}),

  router.get("/ordered-products/:id", async (req, res) => {
    let products = await userHelpers.getOrderProducts(req.params.id);
    console.log(products);
    let category = await categoryHelpers.getAllCategory();
    res.render("user/ordered-products", {
      user_head: true, category, user: req.session.user, products, cartCount
    });
  });

router.get("/product-details/:id", verifyLogin, async (req, res) => {
  console.log(req.params.id);
  let category = await categoryHelpers.getAllCategory();
  let product = await productHelpers.getProductDetails(req.params.id);
  userHelpers.addToCart.apply(req.params.id);
  console.log(product);
  res.render("user/product-details", {
    product,
    user: req.session.user._id,
    user_head: true,
    category,
    cartCount,
  });
});

router.post("/verify-payment", (req, res) => {
  console.log(req.body);
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        console.log("Payment Successful");
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log("error--------" + err);
      res.json({ status: false, errMsg: "" });
    });
});

// ------------------user profile-------------------------

router.get("/my-profile", verifyLogin, async (req, res) => {
  let category = await categoryHelpers.getAllCategory();
  res.render("user/user-profile", {
    user: req.session.user, category, cartCount, user_head: true
  });
});

router.get('/edit-profile', async (req, res) => {
  let category = await categoryHelpers.getAllCategory();
  res.render('user/edit-profile', {
    user: req.session.user, category, user_head: true, cartCount
  });
})

router.post("/edit-profile/:id", (req, res) => {
  userHelpers.editUserProfile(req.params.id, req.body).then(() => {
    res.redirect("/my-profile");
  })
});

router.get('/change-password', verifyLogin, async (req, res) => {
  let category = await categoryHelpers.getAllCategory();
  res.render('user/change-password', {
    user: req.session.user, category, user_head: true, cartCount
  })
})

router.post('/change-password', verifyLogin, async (req, res) => {
  userHelpers.changePassword(req.body, req.session.user._id).then((response) => {
    res.redirect('/my-profile')
  })
})

// invoice 

router.get('/view-invoice/:id', async(req, res)=>{
  try{
    let orderId = req.params.id
    let category = await categoryHelpers.getAllCategory();
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    let products = await userHelpers.getOrderProducts(req.params.id);
    res.render('user/view-invoice', {user: req.session.user, orderId, orders, products, category, user_head:true})
  }catch (error) {
    console.log(error);
  }
})

module.exports = router;
