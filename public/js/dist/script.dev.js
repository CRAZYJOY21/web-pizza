"use strict";

// Бургер меню 
function myFunction(x) {
  x.classList.toggle("change");
} // swiper


var swiper = new Swiper('.swiper-container', {
  cssMode: true,
  loop: true,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev'
  },
  pagination: {
    el: '.swiper-pagination'
  },
  mousewheel: true,
  keyboard: true
});