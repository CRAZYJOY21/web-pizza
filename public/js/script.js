(function ($) {
  $(".btn-product").click(function (e) {
    if (!e.isDefaultPrevented()){
      const product = {
        id: $(this).data('id')
      }
      $.ajax({
        type: 'POST',
        url: '/cart',
        data: product,
        success: function (data) {
          console.log('added product item:', data)
          $('#cart-notify').modal('show')
        }
      })
      return false
    }
  })

  $('.remove-product').click(function () {
    $.ajax({
      type: 'DELETE',
      url: '/cart',
      data: {id: $(this).data('id')},
      success: function () {
        window.location.href = '/cart'
      }
    })
  })
})(jQuery);











// Бургер меню
function myFunction(x) {
  x.classList.toggle("change");
}

// swiper

var swiper = new Swiper('.swiper-container', {
  cssMode: true,
  loop: true,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination'
  },
  mousewheel: true,
  keyboard: true,
});



