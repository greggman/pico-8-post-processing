/*
The MIT License (MIT)

Copyright (c) 2020 Gregg Tavares

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
(function() {

function addLineNumbers(str) {
  return str.split('\n').map((line, ndx) => `${ndx + 1}: ${line}`).join('\n');
}

function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`${gl.getShaderInfoLog(shader)}\n${addLineNumbers(src)}`);
    gl.deleteShader(shader);
    return;
  }
  return shader;
}

function createProgram(gl, vSrc, fSrc) {
  let vs;
  let fs;
  let program;

  vs = createShader(gl, gl.VERTEX_SHADER, vSrc);
  if (vs) {
    fs = createShader(gl, gl.FRAGMENT_SHADER, fSrc);
    if (fs) {
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, 'position');
      gl.linkProgram(program);
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
      }
      console.error(`${gl.getProgramInfoLog(program)}\n=== [ vertex shader ] ===\n${addLineNumbers(vSrc)}\n=== [ fragment shader ] ===\n${addLineNumbers(fSrc)}`);
    }
  }
  if (program) {
    gl.deleteProgram(program);
  }
  if (fs) {
    gl.deleteShader(fs);
  }
  if (vs) {
    gl.deleteShader(vs);
  }
  return;
}

const vs = `
  attribute vec4 position;
  void main() {
    gl_Position = position;
  }
`;

function getFragmentShader(mainImageSrc) {
  return `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    uniform vec3 iResolution;
    uniform float iTime;
    uniform float iTimeDelta;
    uniform float iFrame;
    uniform float iChannelTime[1];
    uniform vec4 iMouse;
    uniform vec4 iDate;
    uniform float iSampleRate;
    uniform vec3 iChannelResolution[1];
    uniform sampler2D iChannel0;

    ${mainImageSrc}

    void main() {
      vec4 fragColor;
      mainImage(fragColor, gl_FragCoord.xy);
      gl_FragColor = fragColor;
    }
  `;
}

const uniformNames = [
  'iResolution',
  'iTime',
  'iTimeDelta',
  'iFrame',
  'iChannelTimev',
  'iMouse',
  'iDate',
  'iSampleRate',
  'iChannelResolution',
  'iChannel0',
];

const defaultFilter = {
  fragmentShader: `
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        // Normalized pixel coordinates (from 0 to 1)
        vec2 uv = fragCoord/iResolution.xy;

        // Time varying pixel color
        fragColor = texture2D(iChannel0, uv);
    }
  `,
  width: 128,
  height: 128,
  filter: false,
};

let newFilter = true;
let currentFilter = {
  ...defaultFilter,
};


// emuluate just enough of the Canvas API for Pico-8
// which is fortunately is only 2 functions!
class Pico8FilterRenderingContext {
  constructor(cavnas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl');
    this.gl = gl;
    this.then = 0;
    this.frame = 0;

    // NOTE: Given there is only 1 texture
    // and 1 buffer the code assumes it never
    // has to re-bind them.

    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,

      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);
    const posLoc = 0;
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const mouse = {
      x: 0,
      y: 0,
      left: 0,
      right: 0,
    };
    this.mouse = mouse;

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * gl.drawingBufferWidth / rect.width;
      mouse.y = gl.drawingBufferHeight - (e.clientY - rect.top) * gl.drawingBufferHeight / rect.height - 1;
      mouse.left = 1;
      mouse.right = 1;
    }

    function handleMouseUp(e) {
      mouse.left = 0;
      mouse.right = 0;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    canvas.addEventListener('mousedown', function() {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    });

  }
  createImageData(width, height) {
    return {
      width: width,
      height: height,
      data: new Uint8Array(width * height * 4),
    };
  }
  putImageData(imageData, x, y) {
    if (x !== 0 || y !== 0) {
      throw new Error('offset to putImageData not support');
    }
    const {width, height, data} = imageData;
    const gl = this.gl;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    if (newFilter) {
      newFilter = false;
      this.updateFilter();
    }

    const now = performance.now() - this.startTime;
    const timeDelta = now - this.then;
    this.then = now;
    const loc = this.uniformLocations;
    const mouse = this.mouse;
    gl.uniform3f(loc.iResolution, gl.drawingBufferWidth, gl.drawingBufferHeight, 1);
    gl.uniform1f(loc.iTime, now * 0.001);
    gl.uniform1f(loc.iTimeDelta, timeDelta * 0.001);
    gl.uniform1f(loc.iFrame, this.frame++);
    gl.uniform1f(loc.iChannelTime, now);
    gl.uniform4f(loc.iMouse, mouse.x, mouse.y, mouse.left, mouse.right);  // no idea what z and w are
    gl.uniform1f(loc.iDate, Date.now() * 0.001);
    gl.uniform1f(loc.iSampleRate, 1); // not used
    gl.uniform3f(loc.iChannelResolution, 128, 128, 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  updateFilter() {
    const gl = this.gl;
    const newPrg = createProgram(gl, vs, getFragmentShader(currentFilter.fragmentShader));
    if (newPrg) {
      if (this.prg) {
        gl.deleteProgram(this, prg);
        return;
      }
      this.uniformLocations = {};
      for (const name of uniformNames) {
        this.uniformLocations[name] = gl.getUniformLocation(newPrg, name);
      }
      this.prg = newPrg;
      gl.useProgram(newPrg);
      const texFilter = currentFilter.filter ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texFilter);
      this.frame = 0;
      this.startTime = performance.now();
      this.then = this.startTime;
    }
    const canvas = this.canvas;
    const newWidth = currentFilter.width || canvas.width;
    const newHeight = currentFilter.height || canvas.height;
    if (canvas.width !== newWidth || canvas.height !== canvas.height) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
  }
}

HTMLCanvasElement.prototype.getContext = function(origFn) {

  return function(type, ...args) {
    if (type !== '2d') {
      return origFn.call(this, type, ...args);
    } else {
      return new Pico8FilterRenderingContext(this);
    }
  };

}(HTMLCanvasElement.prototype.getContext);

window.pico8Filter = {
  setFilter(options) {
    const newFilter = {...defaultFilter};
    for (const [key, value] of Object.entries(options)) {
      if (!(key in newFilter)) {
        console.error('no such option:', key);
        return;
      }
      if (typeof(filter[key]) !== typeof(value)) {
        console.error(`value is wrong type for ${key}, expected ${typeof(filter[key])} was ${typeof(value)}`);
        return;
      }
    }
    currentFilter = newFilter;
    newFilter = true;
  },
};

}());

