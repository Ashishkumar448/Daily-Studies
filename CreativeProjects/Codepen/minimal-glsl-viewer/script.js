document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gl");
  let gl = canvas.getContext("webgl2");

  if (!gl) {
    console.log("WebGL2 not supported, falling back to WebGL.");
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      alert("Your browser does not support WebGL.");
      return;
    }
  }

  const vertexShaderSource = document.getElementById("standard-vs").textContent;
  const fragmentShaderSource = document.getElementById("standard-frag")
    .textContent;

  // Initialize shader
  const shaderProgram = initializeShader(
    gl,
    vertexShaderSource,
    fragmentShaderSource
  );
  if (!shaderProgram) return;

  const vertices = new Float32Array([
    -1.001,
    3.001,
    0.0,
    -1.001,
    -1.001,
    0.0,
    3.001,
    -1.001,
    0.0
  ]);
  const indices = [0, 1, 2];

  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(shaderProgram, "a_Position");
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);

  gl.useProgram(shaderProgram);
  let startTime = null;

  function render(time) {
    if (!startTime) startTime = time;
    const elapsedTime = (time - startTime) / 1000;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_time"), elapsedTime);
    gl.uniform2f(
      gl.getUniformLocation(shaderProgram, "u_resolution"),
      canvas.width,
      canvas.height
    );

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  function initializeShader(gl, vsSource, fsSource) {
    const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        "Unable to initialize the shader program:",
        gl.getProgramInfoLog(program)
      );
      return null;
    }
    return program;
  }

  function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
});