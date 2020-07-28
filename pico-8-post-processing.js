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

/* global console */
/* global HTMLCanvasElement */
/* global HTMLElement */
/* global Image */
/* global location */
/* global performance */
/* global URL */
/* global window */

function addLineNumbers(str) {
  return str.split('\n').map((line, ndx) => `${ndx + 1}: ${line}`).join('\n');
}

/**
 * Checks whether the url's origin is the same so that we can set the `crossOrigin`
 * @param {string} url url to image
 * @returns {boolean} true if the window's origin is the same as image's url
 * @private
 */
function urlIsSameOrigin(url) {
  const localOrigin = (new URL(location.href)).origin;
  const urlOrigin = (new URL(url, location.href)).origin;
  return urlOrigin === localOrigin;
}

function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(`${gl.getShaderInfoLog(shader)}\n${addLineNumbers(src)}`);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vSrc, fSrc) {
  let fs;
  let program;

  const vs = createShader(gl, gl.VERTEX_SHADER, vSrc);
  if (vs) {
    fs = createShader(gl, gl.FRAGMENT_SHADER, fSrc);
    if (fs) {
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, 'position');
      gl.linkProgram(program);
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteShader(vs);
        gl.deleteShader(fs);
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
  return null;
}

function createFilterProgram(gl, fSrc) {
  const isWebGL2 = !!gl.bindBufferBase;
  if (isWebGL2 && !fSrc.includes('texture2D')) {
    const prg = createProgram(gl, vs2, getFragmentShader2(fSrc));
    if (prg) {
      return prg;
    }
  }
  return createProgram(gl, vs, getFragmentShader(fSrc));
}

const vs = `
  attribute vec4 position;
  void main() {
    gl_Position = position;
  }
`;

const vs2 = `#version 300 es
  in vec4 position;
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
    uniform float iChannelTime[4];
    uniform vec4 iMouse;
    uniform vec4 iDate;
    uniform float iSampleRate;
    uniform vec3 iChannelResolution[4];
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;

    ${mainImageSrc}

    void main() {
      vec4 fragColor;
      mainImage(fragColor, gl_FragCoord.xy);
      gl_FragColor = fragColor;
    }
  `;
}

function getFragmentShader2(mainImageSrc) {
  return `#version 300 es
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    uniform vec3 iResolution;
    uniform float iTime;
    uniform float iTimeDelta;
    uniform float iFrame;
    uniform float iChannelTime[4];
    uniform vec4 iMouse;
    uniform vec4 iDate;
    uniform float iSampleRate;
    uniform vec3 iChannelResolution[4];
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;

    ${mainImageSrc}

    out vec4 oOutColor;
    void main() {
      vec4 fragColor;
      mainImage(fragColor, gl_FragCoord.xy);
      oOutColor = fragColor;
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
  'iChannel1',
  'iChannel2',
  'iChannel3',
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
  iChannel0: {
    filter: 'nearest',
    wrap: 'clamp',
    vFlip: true,
  },
  iChannel1: null,
  iChannel2: null,
  iChannel3: null,
};

let haveNewFilter = true;
let currentFilter = {
  ...defaultFilter,
};


// emulate just enough of the Canvas API for Pico-8
// which is fortunately is only 2 functions!
class Pico8FilterRenderingContext {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    this.gl = gl;
    this.then = 0;
    this.frame = 0;
    this.width = 128;
    this.height = 128;
    this.textureDimensions = [
      128, 128, 1,
      1, 1, 1,
      1, 1, 1,
      1, 1, 1,
    ];

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

    this.textures = [];
    for (let i = 0; i < 4; ++i) {
      gl.activeTexture(gl.TEXTURE0 + i);
      const tex = gl.createTexture();
      this.textures.push(tex);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

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

    function handleMouseUp() {
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
    const {gl, canvas} = this;

    this.setupTexture(0, currentFilter.iChannel0, imageData);

    if (haveNewFilter) {
      haveNewFilter = false;
      this.updateFilter();
    }

    {
      const newWidth = this.width < 0
          ? canvas.clientWidth * -this.width
          : this.width;
      const newHeight = this.height < 0
          ? canvas.clientHeight * -this.height
          : this.height;
      if (canvas.width !== newWidth || canvas.height !== canvas.height) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
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
    gl.uniform1fv(loc.iChannelTime, [now, now, now, now]);
    gl.uniform4f(loc.iMouse, mouse.x, mouse.y, mouse.left, mouse.right);  // no idea what z and w are
    gl.uniform1f(loc.iDate, Date.now() * 0.001);
    gl.uniform1f(loc.iSampleRate, 1); // not used
    gl.uniform3fv(loc.iChannelResolution, this.textureDimensions);
    gl.uniform1i(loc.iChannel0, 0);
    gl.uniform1i(loc.iChannel1, 1);
    gl.uniform1i(loc.iChannel2, 2);
    gl.uniform1i(loc.iChannel3, 3);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  updateFilter() {
    const gl = this.gl;
    const newPrg = createFilterProgram(gl, currentFilter.fragmentShader);
    if (newPrg) {
      if (this.prg) {
        gl.deleteProgram(this.prg);
      }
      this.uniformLocations = {};
      for (const name of uniformNames) {
        this.uniformLocations[name] = gl.getUniformLocation(newPrg, name);
      }
      this.prg = newPrg;
      gl.useProgram(newPrg);
      const texFilter = currentFilter.filter ? gl.LINEAR : gl.NEAREST;
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texFilter);
      this.frame = 0;
      this.startTime = performance.now();
      this.then = this.startTime;
      this.width = currentFilter.width || 128;
      this.height = currentFilter.height || 128;
    }

    this.setupTexture(1, currentFilter.iChannel1);
    this.setupTexture(2, currentFilter.iChannel2);
    this.setupTexture(3, currentFilter.iChannel3);
  }
  setupTexture(unit, options, src = null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    if (!options) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return;
    }
    src = src ? src : options.src;
    if (!src) {
      throw new Error(`no 'src' for iChannel${unit}`);
    }

    const {filter, wrap, vFlip} = options;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, vFlip);

    if (typeof src === 'string') {
      const img = new Image();
      img.onload = () => {
        this.setupTexture(unit, {
          ...options,
          src: img,
        });
      };
      img.onerror = () => {
        console.error(`failed to load image: ${src}`);
      };
      if (urlIsSameOrigin(src)) {
        img.crossOrigin = 'anonymous';
      }
      img.src = src;
      return;
    } else if (src instanceof HTMLElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, src.width, src.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, src.data);
    }

    {
      const offset = unit * 3;
      this.textureDimensions[offset    ] = src.width;
      this.textureDimensions[offset + 1] = src.height;
    }

    switch (wrap ? wrap.toLowerCase() : 'clamp') {
      case 'clamp':
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        break;
      case 'repeat':
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        break;
      default:
        throw new Error(`unknown wrap mode: ${wrap} for iChannel${unit}`);
    }

    switch (filter ? filter.toLowerCase() : 'nearest') {
      case 'nearest':
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        break;
      case 'linear':
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        break;
      case 'mipmap':
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        break;
      default:
        throw new Error(`unknown filter mode: ${filter} for iChannel${unit}`);
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
      if (typeof (defaultFilter[key]) !== typeof (value)) {
        console.error(`value is wrong type for ${key}, expected ${typeof defaultFilter[key]} was ${typeof value}`);
        return;
      }
      newFilter[key] = value;
    }
    currentFilter = newFilter;
    haveNewFilter = true;
  },
};

}());

