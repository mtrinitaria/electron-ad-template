var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    iPad: function() {
        return navigator.userAgent.match(/iPad/i) ? true : false;
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

var evtOver;
var evtClick;
var evtMouseDown;
var evtMouseUp;
var evtMouseMove;
var evtLeave;
if (isMobile.any()) {
  evtOver = 'touchstart';
  evtClick = 'touchstart';
  evtMouseDown = 'touchstart';
  evtMouseUp = 'touchend';
  evtMouseMove = 'touchmove';
} else {
  evtOver = 'mouseenter';
  evtLeave = 'mouseleave';
  evtClick = 'click';
  evtMouseDown = 'mousedown';
  evtMouseUp = 'mouseup';
  evtMouseMove = 'mousemove';
}
/**
 * Initializes all the relevant objects and listeners, and sends a message to
 * the JS in the hosting page for the footer to be correctly positioned.
 */


var init = function() {
  var main_container = document.querySelector('.main_container');
  var inpage_wrapper = document.querySelector('.inpage_wrapper');
  var btn = document.querySelector('.shop_now_btn');

  inpage_wrapper.style.visibility = 'visible';

  // var path = document.querySelector('path');
  // var l = path.getTotalLength();

  // TweenMax.set(path, { strokeDasharray:l });
  // // TweenMax.fromTo(path, 0.5, { strokeDashoffset: l }, { strokeDashoffset:0 });
  // TweenMax.set(path, { strokeDashoffset: l });
  // // TweenMax.to(path, 3, { strokeDashoffset: 0, ease: Linear.easeNone });


  TweenLite.set('.copy1, .copy2, .copy3', { autoAlpha: 0 });
  TweenLite.set('.logo', { y: -100 });
  TweenLite.set('.white_b, .cta', { y: 100 });

  var blurElement = { a: 10 };

  TweenMax.to(blurElement, 1, { a: 0, onUpdate: function() {
    TweenMax.set(['.image'], { webkitFilter: 'blur(' + blurElement.a + 'px)', filter: 'blur(' + blurElement.a + 'px)' });
  }});

  TweenLite.from('.image, .gradient', 8, { scale: 1.5, transformOrigin: 'center center' });

  console.time()
  var tl = new TimelineMax();

  tl.addLabel('scene1');

  tl.to('.logo, .white_b, .cta', 0.5, { y: 0 }, 'scene1+=1');
  // tl.to(path, 1, { strokeDashoffset: 0, ease: Linear.easeNone }, 'scene1+=1.5');
  tl.to('.copy1', 0.5, { autoAlpha: 1 }, 'scene1+=2');
  tl.to('.copy1', 0.5, { autoAlpha: 0 }, 'scene1+=4');
  
  tl.addLabel('scene2');

  tl.to('.copy2', 0.5, { autoAlpha: 1 }, 'scene2');
  tl.to('.copy2', 0.5, { autoAlpha: 0 }, 'scene2+=2');
  
  tl.addLabel('scene3');

  tl.to('.copy3', 0.5, { autoAlpha: 1 }, 'scene3');


  tl.to('.cta', 0.5, { autoAlpha: 1 }, 'scene3+=0.25');
  tl.to('.cta', 0.5, { scale: 1.08, yoyo: true, repeat: 5, transformOrigin: 'center' }, 'scene3+=0.25');

  
  

  /*hover event*/
  main_container.addEventListener(evtOver, function() {
    TweenMax.to('.cta', 0.25, { scale: 1.08 });
  });
  main_container.addEventListener(evtLeave, function() {
    TweenMax.to('.cta', 0.25, { scale: 1 });
  });

}



/**
 * Waits for the page to load (and for the Enabler to be initialized) before
 * proceeding to call init().
 */
window.onload = function() {
  politeload();
};
var politeload = function() {
  // init();
  // setTimeout(init, 3000);
  var ticker = setInterval(function() {
    try {
      if (TweenMax) {
        setTimeout(init, 100);
        clearInterval(ticker);
      }
    } catch (e) {}
  }, 100);
};


