export default {
  name: 'Thin Water',
  author: 'khlorghaal',
  authorUrl: 'https://www.shadertoy.com/user/khlorghaal',
  src: 'https://www.shadertoy.com/view/Mt3Bz7',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  filter: {
    fragmentShader: `
//author khlorghaal
//most rights reserved

const float 
 SPEED=.30,
 TURBULENCE=.25,
 ADVECTION=.2,
 DEPTH=.04,
 DROP_AGGRESSIVE= .1510;
#define DROP_COUNT 2
const vec3 
 LIGHT= vec3(-.5,1.,.3),
 COLOR_SUN= vec3(1.1,1.,1.)*12.,
 COLOR_SKY= vec3(.1,.14,.2)*.8;

//#define DEBUG_NORMAL
//#define DEBUG_LIGHT

#define PHI 1.61803399
#define TAU 6.28318531
#define time iTime
#define ASPECT (float(iResolution.x)/float(iResolution.y))
float lum(vec3 rgb){ return dot(rgb,vec3(0.299, 0.587, 0.114)); }
float nmapu(float x){ return x*.5+.5; }
vec2  nmapu(vec2  x){ return x*.5+.5; }
float nmaps(float x){ return x*2.-1.; }
vec2  nmaps(vec2  x){ return x*2.-1.; }
float tri(float x){ return abs(nmaps(fract(x))); }
vec2  tri(vec2  x){ return abs(nmaps(fract(x))); }
vec2 gnse2(vec2 p){ return fract(tan(p*vec2(PHI,PHI*PHI)*512.)*512.*PHI); }

float wave(float x){
    float x0= x;
    x= nmapu(sin( x*45. - time*24. ));
    x= pow(x,24.);//sharpen
    x/= x0*32.+.125;//falloff
    x*= exp(-x0*2.);//damping
    return x;
}
float depthf(vec2 p){
    float bottom= lum(texture2D(iChannel0,p).rgb);//luminance approximates depth
    vec2 flow= vec2(0.,time*SPEED);
    p+= flow;
    float drops;
    #if DROP_COUNT>0
    {
        vec2 p_= p;
        p_.x*=ASPECT;
        const float A= DROP_AGGRESSIVE;
        const float fdc= float(DROP_COUNT);
        for(int i=0;i!=DROP_COUNT;i++){
            //ringbuffer analogy
            float fi= float(i);
            float offset= time*fdc*A;
            float seed= fi+floor(offset);
            float fade= tri(offset/(fdc+1.)/A);//fixme i cant get fadeout right
            vec2 locus= gnse2(vec2(seed))*3.-1.;
            locus.x*=ASPECT;
            vec2 d= locus-p_;
            d= tri(d);//spatial loop, must be continuous
            //drops+= max(0.,.5-length(d))*fade;
            drops+= wave(length(d))*fade;
        }
    }
    #endif
    p+= bottom*ADVECTION;//divergence
    float surface= lum(texture2D(iChannel1,p*TURBULENCE).rgb)*TURBULENCE;
    return surface*DEPTH+drops*.1;
	//return (surface-bottom)*DEPTH;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 uv= fragCoord/iResolution.xy;
    vec2 uv0= uv;
    
    float d= 0.04;
    float d0= depthf(uv);    
    vec2 grad= (vec2(
    	depthf(uv+vec2(d,0)),
        depthf(uv+vec2(0,d))
    )-d0)/d;
    vec3 N= normalize(vec3(grad.x,grad.y,1.));
    
    //environment
    float L= max(0., reflect(normalize(LIGHT), N).z );
    //improv lobes (dangerous fun)
    float sun= pow(L,14.);
    float sky= pow(L+.5,1.4);
    vec3 specular= vec3(COLOR_SUN)*sun + vec3(COLOR_SKY)*sky;
    
    uv+= refract(vec3(0.,0.,1.), N, 1.4).xy*DEPTH;
    
    vec3 col= pow(texture2D(iChannel0, uv).rgb, vec3(1./2.2));
    col-= col*COLOR_SKY;//ambience inversion
    //funky gamma for style
    col+= specular;
    col= pow(col+.1,vec3(2.8));
    
       
    #ifdef DEBUG_LIGHT
    col= vec3(specular);
    #endif
    #ifdef DEBUG_NORMAL
    col= N*.5+.5;
    #endif
    //col= vec3(0.,nse2(uv0));
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
      src: blur(blur(createNoise(256, 256))),
      filter: 'mipMap',
      wrap: 'repeat',
    },
  },
};

function applyKernel(kernel, imageData) {
  const {data, width, height} = imageData;
  const src = data.slice();

  function getValue(x, y, channel) {
    return src[(x + width) % width + ((y + height) % height * width) * 4 + channel];
  }

  for (let i = 0; i < data.length; ++i) {
    const p = i / 4 | 0;
    const xx = p % width;
    const yy = p / width | 0;
    const channel = p % 4;
    let total = 0;
    let totalF = 0;
    for (const {x, y, f} of kernel) {
      total += getValue(xx + x, yy + y, channel) * f;
      totalF += f;
    }
    data[i] = total / totalF;
  }
  return imageData;
}

function blur(imageData) {
  const kernel = [
    {x: -1, y: -1, f: 1 / 16, },
    {x:  1, y: -1, f: 1 / 16, },
    {x: -1, y:  1, f: 1 / 16, },
    {x:  1, y:  1, f: 1 / 16, },
    {x: -1, y:  0, f:  1 / 8, },
    {x:  1, y:  0, f:  1 / 8, },
    {x:  0, y: -1, f:  1 / 8, },
    {x:  0, y:  1, f:  1 / 8, },
    {x:  0, y:  0, f:  1 / 4, },
  ];
  return applyKernel(kernel, imageData);
}

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
