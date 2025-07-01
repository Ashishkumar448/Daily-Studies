TweenLite.defaultEase = Linear.easeNone;


//show the square only once js has run
//visibility set to hidden in css panel
TweenLite.set(".square", {visibility:"visible"});



var tl = new TimelineLite();
tl.fromTo(".l1", 1, {height:0}, {height:100wh})
.fromTo(".l2", 4, {width:0, backgroundColor:"red"}, {width:100%, backgroundColor:"blue"})
  .fromTo(".l3", 1, {height:0}, {height:200})
  .fromTo(".l4", 1, {width:0}, {width:200})

tl.timeScale(4) //play faster