export default {
  name: 'default',
  author: 'gman',
  authorUrl: 'https://greggman.github.io',
  src: 'https://github.com/greggman/pico-8-post-processing/blob/master/nano-villager_html/filters/default.js',
  license: 'MIT',
  licenseUrl: 'http://github.com/greggman/pico-8-post-proessings/LICENSE.md',
  filter: {
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
  },
};
