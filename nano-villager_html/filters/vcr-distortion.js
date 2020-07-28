export default {
  name: 'VCR distortion',
  author: 'ryk',
  authorUrl: 'https://www.shadertoy.com/user/ryk',
  src: 'https://www.shadertoy.com/view/ldjGzV',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  filter: {
    fragmentShader: `
float noise(vec2 p)
{
	float s = texture2D(iChannel1,vec2(1.,2.*cos(iTime))*iTime*8. + p*1.).x;
	s *= s;
	return s;
}

float onOff(float a, float b, float c)
{
	return step(c, sin(iTime + a*cos(iTime*b)));
}

float ramp(float y, float start, float end)
{
	float inside = step(start,y) - step(end,y);
	float fact = (y-start)/(end-start)*inside;
	return (1.-fact) * inside;
	
}

float stripes(vec2 uv)
{
	
	float noi = noise(uv*vec2(0.5,1.) + vec2(1.,3.));
	return ramp(mod(uv.y*4. + iTime/2.+sin(iTime + sin(iTime*0.63)),1.),0.5,0.6)*noi;
}

vec3 getVideo(vec2 uv)
{
	vec2 look = uv;
	float window = 1./(1.+20.*(look.y-mod(iTime/4.,1.))*(look.y-mod(iTime/4.,1.)));
	look.x = look.x + sin(look.y*10. + iTime)/50.*onOff(4.,4.,.3)*(1.+cos(iTime*80.))*window;
	float vShift = 0.4*onOff(2.,3.,.9)*(sin(iTime)*sin(iTime*20.) + 
										 (0.5 + 0.1*sin(iTime*200.)*cos(iTime)));
	look.y = mod(look.y + vShift, 1.);
	vec3 video = vec3(texture2D(iChannel0,look));
	return video;
}

vec2 screenDistort(vec2 uv)
{
	uv -= vec2(.5,.5);
	uv = uv*1.2*(1./1.2+2.*uv.x*uv.x*uv.y*uv.y);
	uv += vec2(.5,.5);
	return uv;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	uv = screenDistort(uv);
	vec3 video = getVideo(uv);
	float vigAmt = 3.+.3*sin(iTime + 5.*cos(iTime*5.));
	float vignette = (1.-vigAmt*(uv.y-.5)*(uv.y-.5))*(1.-vigAmt*(uv.x-.5)*(uv.x-.5));
	
	video += stripes(uv);
	video += noise(uv*2.)/2.;
	video *= vignette;
	video *= (12.+mod(uv.y*30.+iTime,1.))/13.;
	
	fragColor = vec4(video,1.0);
}
      `,
    width: -1,
    height: -1,
    iChannel1: {
      src: createNoise(256, 256),
      filter: 'mipMap',
      wrap: 'repeat',
      vFlip: true,
    },
  },
};

function createNoise(width, height) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; ++i) {
    data[i] = Math.random() * 256;
  }
  return {
    width,
    height,
    data,
  };
}
