export default {
  name: 'hi-res roto',
  author: 'gman',
  authorUrl: 'https://greggman.github.io',
  src: 'https://github.com/greggman/pico-8-post-processing/blob/master/nano-villager_html/filters/hi-res-roto.js',
  license: 'MIT',
  licenseUrl: 'http://github.com/greggman/pico-8-post-proessings/LICENSE.md',
  filter: {
    fragmentShader: `
      void mainImage( out vec4 fragColor, in vec2 fragCoord )
      {
          vec2 uv = fragCoord / iResolution.xy * 2.0 - 1.0;
          uv = vec2(
            uv.x * cos(iTime) - uv.y * sin(iTime),
            uv.y * cos(iTime) + uv.x * sin(iTime)) *
            mix(0.5, 4.0, sin(iTime) * 0.5 + 0.5);
          fragColor = texture2D(iChannel0, uv * 0.5 + 0.5);
      }
    `,
    width: -2,
    height: -2,
    iChannel0: {
      filter: 'nearest',
      wrap: 'repeat',
      vFlip: true,
    },
  },
};
