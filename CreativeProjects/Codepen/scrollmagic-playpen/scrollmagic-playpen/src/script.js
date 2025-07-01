var controller = new ScrollMagic.Controller();

// build scene
var scene = new ScrollMagic.Scene({triggerElement: "#trigger", duration: "300%", offset: 0})
						.setPin("#sky")
						.addIndicators({name: "Sticky Pin"}) // add indicators (requires plugin)
						.addTo(controller);
var scene2 = new
ScrollMagic.Scene({triggerElement: "#trigger", duration: "100%",offset: 200})
  // animate color and top border in relation to scroll position
  
  .setTween("#moon", { scale: 1.7}) // the tween durtion can be omitted and defaults to 1
  .addIndicators({name: "Color/Shape Change"}) // add indicators (requires plugin)
  .addTo(controller);
var scene3 = new
ScrollMagic.Scene({triggerElement: "#trigger2", duration: "200%",offset: 0})
  // animate color and top border in relation to scroll position
  
  .setTween("#sky", { backgroundColor: "#000" }) // the tween durtion can be omitted and defaults to 1
  .addIndicators({name: "sky"}) // add indicators (requires plugin)
  .addTo(controller);
var Hello = new ScrollMagic.Scene({triggerElement: "#trigger2", duration: "250%", offset: "-250vh"})
						.setPin("#hello")
						.addIndicators({name: "Hello"}) // add indicators (requires plugin)
						.addTo(controller);
var HelloFade = new ScrollMagic.Scene({triggerElement: "#trigger2", duration: "100%", offset: 60})
            .setTween("#hello h1", { opacity: "1" })
						.addIndicators({name: "HelloFade"}) // add indicators (requires plugin)
						.addTo(controller);
