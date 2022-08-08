'use strict';

// modal variables
const modal = document.querySelector('[data-modal]');
const modalCloseBtn = document.querySelector('[data-modal-close]');
const modalCloseOverlay = document.querySelector('[data-modal-overlay]');

// modal function
const modalCloseFunc = function () { modal.classList.add('closed') }

// modal eventListener
modalCloseOverlay.addEventListener('click', modalCloseFunc);
modalCloseBtn.addEventListener('click', modalCloseFunc);

// notification toast variables
const notificationToast = document.querySelector('[data-toast]');
const toastCloseBtn = document.querySelector('[data-toast-close]');

// notification toast eventListener
toastCloseBtn.addEventListener('click', function () {
  notificationToast.classList.add('closed');
});





// mobile menu variables
const mobileMenuOpenBtn = document.querySelectorAll('[data-mobile-menu-open-btn]');
const mobileMenu = document.querySelectorAll('[data-mobile-menu]');
const mobileMenuCloseBtn = document.querySelectorAll('[data-mobile-menu-close-btn]');
const overlay = document.querySelector('[data-overlay]');

for (let i = 0; i < mobileMenuOpenBtn.length; i++) {

  // mobile menu function
  const mobileMenuCloseFunc = function () {
    mobileMenu[i].classList.remove('active');
    overlay.classList.remove('active');
  }

  mobileMenuOpenBtn[i].addEventListener('click', function () {
    mobileMenu[i].classList.add('active');
    overlay.classList.add('active');
  });

  mobileMenuCloseBtn[i].addEventListener('click', mobileMenuCloseFunc);
  overlay.addEventListener('click', mobileMenuCloseFunc);

}

// for product-details page

$(document).ready(function () {
  var slider = $("#slider");
  var thumb = $("#thumb");
  var slidesPerPage = 4; //globaly define number of elements per page
  var syncedSecondary = true;
  slider.owlCarousel({
    items: 1,
    slideSpeed: 2000,
    nav: false,
    autoplay: false,
    dots: false,
    loop: true,
    responsiveRefreshRate: 200
  }).on('changed.owl.carousel', syncPosition);
  thumb
    .on('initialized.owl.carousel', function () {
      thumb.find(".owl-item").eq(0).addClass("current");
    })
    .owlCarousel({
      items: slidesPerPage,
      dots: false,
      nav: true,
      item: 4,
      smartSpeed: 200,
      slideSpeed: 500,
      slideBy: slidesPerPage,
      navText: ['<svg width="18px" height="18px" viewBox="0 0 11 20"><path style="fill:none;stroke-width: 1px;stroke: #000;" d="M9.554,1.001l-8.607,8.607l8.607,8.606"/></svg>', '<svg width="25px" height="25px" viewBox="0 0 11 20" version="1.1"><path style="fill:none;stroke-width: 1px;stroke: #000;" d="M1.054,18.214l8.606,-8.606l-8.606,-8.607"/></svg>'],
      responsiveRefreshRate: 100
    }).on('changed.owl.carousel', syncPosition2);
  function syncPosition(el) {
    var count = el.item.count - 1;
    var current = Math.round(el.item.index - (el.item.count / 2) - .5);
    if (current < 0) {
      current = count;
    }
    if (current > count) {
      current = 0;
    }
    thumb
      .find(".owl-item")
      .removeClass("current")
      .eq(current)
      .addClass("current");
    var onscreen = thumb.find('.owl-item.active').length - 1;
    var start = thumb.find('.owl-item.active').first().index();
    var end = thumb.find('.owl-item.active').last().index();
    if (current > end) {
      thumb.data('owl.carousel').to(current, 100, true);
    }
    if (current < start) {
      thumb.data('owl.carousel').to(current - onscreen, 100, true);
    }
  }
  function syncPosition2(el) {
    if (syncedSecondary) {
      var number = el.item.index;
      slider.data('owl.carousel').to(number, 100, true);
    }
  }
  thumb.on("click", ".owl-item", function (e) {
    e.preventDefault();
    var number = $(this).index();
    slider.data('owl.carousel').to(number, 300, true);
  });


  $(".qtyminus").on("click", function () {
    var now = $(".qty").val();
    if ($.isNumeric(now)) {
      if (parseInt(now) - 1 > 0) { now--; }
      $(".qty").val(now);
    }
  })
  $(".qtyplus").on("click", function () {
    var now = $(".qty").val();
    if ($.isNumeric(now)) {
      $(".qty").val(parseInt(now) + 1);
    }
  });
});




// accordion variables
const accordionBtn = document.querySelectorAll('[data-accordion-btn]');
const accordion = document.querySelectorAll('[data-accordion]');

for (let i = 0; i < accordionBtn.length; i++) {

  accordionBtn[i].addEventListener('click', function () {

    const clickedBtn = this.nextElementSibling.classList.contains('active');

    for (let i = 0; i < accordion.length; i++) {

      if (clickedBtn) break;

      if (accordion[i].classList.contains('active')) {

        accordion[i].classList.remove('active');
        accordionBtn[i].classList.remove('active');

      }

    }

    this.nextElementSibling.classList.toggle('active');
    this.classList.toggle('active');

  });

}

// image zoom in product showing

(function ($) {
  $(document).ready(function () {
      $('.xzoom, .xzoom-gallery').xzoom({ zoomWidth: 400, title: true, tint: '#333', Xoffset: 15 });
      $('.xzoom2, .xzoom-gallery2').xzoom({ position: '#xzoom2-id', tint: '#ffa200' });
      $('.xzoom3, .xzoom-gallery3').xzoom({ position: 'lens', lensShape: 'circle', sourceClass: 'xzoom-hidden' });
      $('.xzoom4, .xzoom-gallery4').xzoom({ tint: '#006699', Xoffset: 15 });
      $('.xzoom5, .xzoom-gallery5').xzoom({ tint: '#006699', Xoffset: 15 });

      //Integration with hammer.js
      var isTouchSupported = 'ontouchstart' in window;

      if (isTouchSupported) {
          //If touch device
          $('.xzoom, .xzoom2, .xzoom3, .xzoom4, .xzoom5').each(function () {
              var xzoom = $(this).data('xzoom');
              xzoom.eventunbind();
          });

          $('.xzoom, .xzoom2, .xzoom3').each(function () {
              var xzoom = $(this).data('xzoom');
              $(this).hammer().on("tap", function (event) {
                  event.pageX = event.gesture.center.pageX;
                  event.pageY = event.gesture.center.pageY;
                  var s = 1, ls;

                  xzoom.eventmove = function (element) {
                      element.hammer().on('drag', function (event) {
                          event.pageX = event.gesture.center.pageX;
                          event.pageY = event.gesture.center.pageY;
                          xzoom.movezoom(event);
                          event.gesture.preventDefault();
                      });
                  }

                  xzoom.eventleave = function (element) {
                      element.hammer().on('tap', function (event) {
                          xzoom.closezoom();
                      });
                  }
                  xzoom.openzoom(event);
              });
          });

          $('.xzoom4').each(function () {
              var xzoom = $(this).data('xzoom');
              $(this).hammer().on("tap", function (event) {
                  event.pageX = event.gesture.center.pageX;
                  event.pageY = event.gesture.center.pageY;
                  var s = 1, ls;

                  xzoom.eventmove = function (element) {
                      element.hammer().on('drag', function (event) {
                          event.pageX = event.gesture.center.pageX;
                          event.pageY = event.gesture.center.pageY;
                          xzoom.movezoom(event);
                          event.gesture.preventDefault();
                      });
                  }

                  var counter = 0;
                  xzoom.eventclick = function (element) {
                      element.hammer().on('tap', function () {
                          counter++;
                          if (counter == 1) setTimeout(openfancy, 300);
                          event.gesture.preventDefault();
                      });
                  }

                  function openfancy() {
                      if (counter == 2) {
                          xzoom.closezoom();
                          $.fancybox.open(xzoom.gallery().cgallery);
                      } else {
                          xzoom.closezoom();
                      }
                      counter = 0;
                  }
                  xzoom.openzoom(event);
              });
          });

          $('.xzoom5').each(function () {
              var xzoom = $(this).data('xzoom');
              $(this).hammer().on("tap", function (event) {
                  event.pageX = event.gesture.center.pageX;
                  event.pageY = event.gesture.center.pageY;
                  var s = 1, ls;

                  xzoom.eventmove = function (element) {
                      element.hammer().on('drag', function (event) {
                          event.pageX = event.gesture.center.pageX;
                          event.pageY = event.gesture.center.pageY;
                          xzoom.movezoom(event);
                          event.gesture.preventDefault();
                      });
                  }

                  var counter = 0;
                  xzoom.eventclick = function (element) {
                      element.hammer().on('tap', function () {
                          counter++;
                          if (counter == 1) setTimeout(openmagnific, 300);
                          event.gesture.preventDefault();
                      });
                  }

                  function openmagnific() {
                      if (counter == 2) {
                          xzoom.closezoom();
                          var gallery = xzoom.gallery().cgallery;
                          var i, images = new Array();
                          for (i in gallery) {
                              images[i] = { src: gallery[i] };
                          }
                          $.magnificPopup.open({ items: images, type: 'image', gallery: { enabled: true } });
                      } else {
                          xzoom.closezoom();
                      }
                      counter = 0;
                  }
                  xzoom.openzoom(event);
              });
          });

      } else {
          //If not touch device

          //Integration with fancybox plugin
          $('#xzoom-fancy').bind('click', function (event) {
              var xzoom = $(this).data('xzoom');
              xzoom.closezoom();
              $.fancybox.open(xzoom.gallery().cgallery, { padding: 0, helpers: { overlay: { locked: false } } });
              event.preventDefault();
          });

          //Integration with magnific popup plugin
          $('#xzoom-magnific').bind('click', function (event) {
              var xzoom = $(this).data('xzoom');
              xzoom.closezoom();
              var gallery = xzoom.gallery().cgallery;
              var i, images = new Array();
              for (i in gallery) {
                  images[i] = { src: gallery[i] };
              }
              $.magnificPopup.open({ items: images, type: 'image', gallery: { enabled: true } });
              event.preventDefault();
          });
      }
  });
})(jQuery);




function addToCart(proId) {
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#cart-count')
        count = parseInt(count) + 1
        $('#cart-count').html(count)
      }
    }
  })
}

// $("#checkout-form").submit((e) => {
//   console.log('nithy');
//   e.preventDefault()
//   $.ajax({
//     url: '/place-order',
//     method: 'post',
//     data: $('#checkout-form').serialize(),
//     success:(response=>{
//       alert('place order')
//     })
//   })
// })