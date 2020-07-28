export default {
  name: 'Double Vision',
  author: 'CloneDeath',
  authorUrl: 'https://www.shadertoy.com/user/CloneDeath',
  src: 'https://www.shadertoy.com/view/lsSXD1',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  filter: {
    fragmentShader: `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 texcoord = fragCoord.xy / iResolution.xy;
    vec2 texcoord2 = (fragCoord.xy + vec2(1, 1)) / iResolution.xy;
    
    vec4 color = texture2D(iChannel0, texcoord);
    vec4 color2 = texture2D(iChannel0, texcoord2);
    
    fragColor = ((-10.0 * abs(color - color2)) + 1.0) * color;
}
    `,
    width: -1,
    height: -1,
    iChannel0: {
     filter: 'nearest',
     vFlip: true,
   },
 },
};
