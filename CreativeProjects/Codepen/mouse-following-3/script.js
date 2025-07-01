$(document).ready(function () {
  // Создаем CSS класс программно
  $("<style>")
    .prop("type", "text/css")
    .html(
      `
      .colored-div {
        width: 250px;
        height: 250px;
        font-size:30px;
        font-weight:100;
        float: left;
       
        margin: 5px;
        position: absolute; 
        transition: all 1s ease-out;
         mix-blend-mode:overlay;
      }
      .counter2, 
            .counter {
       
   opacity:0.6;
        margin: 5px;
        position: absolute; 
        transition: all 1s ease-out;
       color:#fff;
      
      }
      
      .white-div {
       
        height: 1px;
        margin: 5px;
        position: absolute; 
        transition: all 1s ease-out;
       background:#fff;
       opacity:0.7;
      }
      
       .white-div-vert {
        opacity:0.8;
        width: 1px;
        margin: 5px;
        position: absolute; 
        transition: all 1s ease-out;
       background:#fff;
        opacity:0.7;
      }
      
    `
    )
    .appendTo("body");

  for (let i = 0; i < 10; i++) {
    const randomBgColor =
      "rgba(" + 255 + "," + (0 + i * 12) + ", " + (50 + i * 20) + ", 0.85)";

    const div = $("<div>+</div>");

    div.addClass("colored-div");

    div.css("backgroundColor", randomBgColor);

    $("body").append(div);

    div.css({
      left: Math.random() * $(window).width() - 130 + "px",
      top: Math.random() * $(window).height() - 130 + "px"
    });
  }

  // Обработчик движения мыши
  $(document).mousemove(function (e) {
    $(".colored-div").each(function () {
      let offsetX = Math.random() * 220 - 200;
      let offsetY = Math.random() * 220 - 200;

      // Устанавливаем позицию div
      $(this).css({
        left: e.clientX + offsetX + "px",
        top: e.clientY + offsetY + "px"
      });
    });
  });

  for (let i = 0; i < 20; i++) {
    const randomWidth = Math.random() * 50 + "px";

    const div = $("<div></div>");

    div.addClass("white-div");

    div.css("width", randomWidth);

    $("body").append(div);

    div.css({
      left: Math.random() * $(window).width() - 30 + "px",
      top: Math.random() * $(window).height() - 30 + "px"
    });
  }

  // Обработчик движения мыши
  $(document).mousemove(function (e) {
    $(".white-div").each(function () {
      let offsetX = Math.random() * 20 - 10;
      let offsetY = Math.random() * 20 - 10;

      // Устанавливаем позицию div
      $(this).css({
        marginLeft: e.clientX / 150 + offsetX + "px",
        marginTop: e.clientY / 150 + offsetY + "px"
      });
    });
  });
  for (let i = 0; i < 10; i++) {
    const randomWidth = Math.random() * 30 + "px";

    const div = $("<div></div>");

    div.addClass("white-div-vert");

    div.css("height", randomWidth);

    $("body").append(div);

    div.css({
      left: Math.random() * $(window).width() - 30 + "px",
      top: Math.random() * $(window).height() - 30 + "px"
    });
  }

  // Обработчик движения мыши
  $(document).mousemove(function (e) {
    $(".white-div-vert").each(function () {
      let offsetX = Math.random() * 20 - 10;
      let offsetY = Math.random() * 20 - 10;

      $(this).css({
        marginLeft: e.clientX / 150 + offsetX + "px",
        marginTop: e.clientY / 150 + offsetY + "px"
      });
    });
  });

  for (let i = 0; i < 5; i++) {
    const div = $("<div></div>");

    div.addClass("counter");

    $("body").append(div);

    div.css({
      left: Math.random() * $(window).width() - 20 + "px",
      top: Math.random() * $(window).height() - 20 + "px"
    });
  }

  // Обработчик движения мыши
  $(document).mousemove(function (e) {
    $(".counter").each(function () {
      $(this).text(e.clientX);

      let offsetX = Math.random() * 100 - 50;
      let offsetY = Math.random() * 100 - 50;

      // Устанавливаем позицию div
      $(this).css({
        marginLeft: e.clientX / 150 + offsetX + "px",
        marginTop: e.clientY / 150 + offsetY + "px"
      });
    });
  });
  
  
  for (let i = 0; i < 5; i++) {
    const div = $("<div></div>");

    div.addClass("counter2");

    $("body").append(div);

    div.css({
      left: Math.random() * $(window).width() - 20 + "px",
      top: Math.random() * $(window).height() - 20 + "px"
    });
  }

  // Обработчик движения мыши
  $(document).mousemove(function (e) {
    $(".counter2").each(function () {
      $(this).text(e.clientY);

      let offsetX = Math.random() * 100 - 50;
      let offsetY = Math.random() * 100 - 50;

      // Устанавливаем позицию div
      $(this).css({
        marginLeft: e.clientX / 150 + offsetX + "px",
        marginTop: e.clientY / 150 + offsetY + "px"
      });
    });
  });
});