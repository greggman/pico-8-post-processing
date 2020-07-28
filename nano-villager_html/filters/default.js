export default {
  name: 'default',
  license: 'CC0',
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
