export default {
  name: 'Gameboy Classic',
  author: 'jilski',
  authorUrl: 'https://www.shadertoy.com/user/jilski',
  src: 'https://www.shadertoy.com/view/MdyfDR',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  filter: {
    fragmentShader: `
/*

	Nintendo GameBoy Classic (DMG) Post-Effect
	Written by jilski for the strangeness project (http://strangeness.jilski.com)
	June 2018

	Strangeness is a monthly live music & visuals concert experience taking place in Berlin.
	While acoustic instruments are the musical core of the show - which resolves
	around space and retro 8-bit video games - the projection into the room is handled
	by a sound analysis and video synthesis system based on the Vulkan API and lots of shaders.
	It all reacts to the music and is supposed to make sense.

	This effect depends on the live music volume and other parameters. This has been
	simplified for Shadertoy. I left "blend_factor" and loudness in as dummies, as well as
	pix_size.

	Since I've taken a lot of inspiration from shaders on this side and am using some
	re-written variations for my own show so I thought it'd be very fair to give back
	a bit.

	Yeah and you're all invited to strangeness.
*/

vec3 rgb(int r, int g, int b)
{
  return vec3(float(r)/256.,float(g)/256.,float(b)/256.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  // blend_factor goes from 0 to 1
  // here's a curve to show the effect of transitioning
  float blend_factor = 1.0-pow(0.5+0.5*cos(iTime/10.0),2.0);
    
  // originally, this is the volume of the music... not sure how to get the volume of the video playback... so it's a stud
  float loudness = cos(iTime/0.5);
    
  // original gameboy dmg resolution: 160*144
  float pix_size = 8.0;


  // i took pictures of my own gameboy classic and measured the rgb then adjusted to taste and memory :D
  //vec3 palette[4] = vec3[](rgb(180,210,46), rgb(155,195,40), rgb(108,151,35), rgb(54,112,30));
  //vec3 line = palette[0]*1.6; // line are the lines between pixels. they are brighter.
  vec3 line = texture2D(iChannel1, vec2(0,0)).rgb * 1.6;
    
  vec2 coord = fragCoord/iResolution.xy;

  vec2 resolution = vec2(iResolution.x/pix_size,iResolution.y/pix_size);

  vec2 uv = mix(coord,(floor(coord*resolution) / resolution),blend_factor);
  vec2 pix = uv * resolution;

  vec3 orig = texture2D(iChannel0,uv).rgb;
  vec3 col = line;
  vec2 line_width = vec2(1.0/iResolution.x,1.0/iResolution.y);
    
  vec2 pix_thresh = mix(vec2(0.),line_width,blend_factor);
  
  bool is_pixel = (coord.x-uv.x) > pix_thresh.x && (coord.y-uv.y) > pix_thresh.y;
    
  // good old times when some pixel columns were broken. remember? :D
  bool is_not_broken = int(pix.x) != int(resolution.x)-2
      && (int(pix.x) != int(resolution.x)-4 || fract(4.0*sin(iTime/10.))>0.95) && int(pix.x) != 1;
    
  if ( is_pixel && is_not_broken )
  {
    float val = (orig.r+orig.g+orig.b)/3.0;
    int shade = int(min(3.0,4.0*log(1.0+val*1.71))); // log(1+x*(e-1))
    //col = palette[shade];
    col = texture2D(iChannel1, (vec2(shade, 0) + 0.5) / iChannelResolution[1].xy).rgb;
      
    // the following is optional: it's just some gradient across the screen.
    // like a bit of sunlight screwing up the contrast :D
    vec2 offs = 3.*vec2(0.5+0.5*sin(iTime), 0.5+0.5*cos(iTime/1.2));
    vec2 cen = vec2(0.5,0.5) + offs;
    col += vec3(0.1,0.14,0.01)*(0.5+0.5*sin(atan(cen.x,cen.y))); // slight loss of contrast, moving with time
    col -= vec3(0.8,1.0,0.5)*5.0*sin(loudness)*length(uv-coord); // slight pixel 3d-ness
  }

  // slight vignette
  col *= 1.1 - 0.3*distance(coord,vec2(0.5,0.5));

  col = mix(orig,col,blend_factor);

  fragColor = vec4(col,1.0);
}
`,
    width: -1,
    height: -1,
    iChannel0: {
     filter: 'linear',
     vFlip: true,
   },
   iChannel1: {
     filter: 'nearest',
     src: {
       width: 4,
       height: 1,
       data: new Uint8Array([
          180, 210, 46, 255,
          155, 195, 40, 255,
          108, 151, 35, 255,
          54, 112, 30, 255,
       ]),
     },
   },
 },
};
