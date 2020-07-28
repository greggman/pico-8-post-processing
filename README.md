# Pico-8 Post Processing

[Pico-8](https://www.lexaloffle.com/pico-8.php) exports to HTML via
`export somename.html`

Add this script to the top of that page as in

```html
<script src="https://greggman.github.io/pico-8-post-processing/pico-8-post-processing.js"></script>
```

The below it add your WebGL post processing filter.

```html
<script>
pico8Filter.setFilter({
  fragmentShader: `
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 uv = fragCoord / iResolution.xy;
        fragColor = texture2D(iChannel0, uv);
    }
  `,
  width: 128,
  height: 128,
  filter: false,
});
</script>
```

Filters are based on the same uniforms as [Shadertoy](https://shadertoy.com). In particular you're
expect to write a GLSL shader function like this

```glsl
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture2D(iChannel0, uv);
}
```

with access to [the same inputs as Shadertoy](https://www.shadertoy.com/howto). In particular

## Uniforms

* `uniform vec3 iResolution;`

  The resolution of the canvas

* `uniform float iTime;`

  The time in seconds since the filter was set

* `uniform float iTimeDelta;`

  The time in seconds since the previous frame

* `uniform float iFrame;`

  The frame count since the filter was set

* `uniform float iChannelTime[0];`

  The same as `iTime`

* `uniform vec4 iMouse;`

   `xy` are the mouse position in canvas coordinates, z is the mouse button.
   note: `xy` are only updated when the button is pressed.

* `uniform vec4 iDate;`

  The date in seconds since January 1st 1970

* `uniform vec3 iChannelResolution[0];`

  The size of the input texture which is always (128x128) Pico-8

* `uniform samplerXX iChannel0;`

  The Pico-8 texture

## Options

Call `pico8Filter.setFilter` to set a new filter.

* `fragmentShader` (string)

  The `mainImage` GLSL function for your filter

* `width`, `height` (number)

  The width to the resolution of the canvas. Pico-8's normal canvas
  size is 128x128 but if you want to post process you probably want
  more output pixels than input pixels.

* `filter` (boolean)

  `true` = set filtering to `LINEAR` for the input Pico-8 texture

  `false` = set filtering to `NEAREST` for the input Pico-8 texture

## Licence

MIT

