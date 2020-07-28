export default {
  name: 'There\'s a bug in the TV',
  author: 'thiagoborn',
  authorUrl: 'https://www.shadertoy.com/user/thiagoborn',
  src: 'https://www.shadertoy.com/view/WsBGRW',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  filter: {
    fragmentShader: `
/*
Inspired by
https://www.shadertoy.com/view/ldXGW4 by https://www.shadertoy.com/user/ehj1
https://www.shadertoy.com/view/XtK3W3 by https://www.shadertoy.com/user/dyvoid
https://www.shadertoy.com/view/Xdl3D8 by https://www.shadertoy.com/user/jmpep
https://www.shadertoy.com/view/ldjGzV by https://www.shadertoy.com/user/ryk
*/

float rand2d(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise(float p) {
	float fl = floor(p);
  	float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

float map(float val, float amin, float amax, float bmin, float bmax) {
    float n = (val - amin) / (amax-amin);
    float m = bmin + n * (bmax-bmin);
    return m;
}

float snoise(float p){
    return map(noise(p),0.0,1.0,-1.0,1.0);
}

float threshold(float val,float cut){
    float v = clamp(abs(val)-cut,0.0,1.0);
    v = sign(val) * v;
    float scale = 1.0 / (1.0 - cut);
    return v * scale;
}

#define CURVE 
#define SCANS
#define FLICKS
#define GRAINS 
#define YBUG 
#define DIRTY
#define STRIP
#define COLOR
#define BLINK
#define VIG

float FREQUENCY = 11.0;

vec2 uv_curve(vec2 uv) {
	uv = (uv - 0.5) * 2.0;
	uv *= 1.2;	
	uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
	uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
    uv /= 1.15;
	uv  = (uv / 2.0) + 0.5;
	return uv;
}

vec3 color(sampler2D tex, vec2 uv){        
    vec3 color = texture(iChannel0,uv).rgb;
    #ifdef COLOR
    float bw = (color.r + color.g + color.b) / 3.0;
    color = mix(color,vec3(bw,bw,bw),.95);
    float p = 1.5;
    color.r = pow(color.r,p);
    color.g = pow(color.g,p-0.1);
    color.b = pow(color.b,p);
    #endif
    return color;
}

vec3 ghost(sampler2D tex, vec2 uv){
    #ifdef FLICKS
    
    float n1 = threshold(snoise(iTime*10.),.85);
    float n2 = threshold(snoise(2000.0+iTime*10.),.85);
    float n3 = threshold(snoise(3000.0+iTime*10.),.85);
    
    vec2 or = vec2(0.,0.);
    vec2 og = vec2(0,0.);
    vec2 ob = vec2(0.,0);

    float os = .05;
    or += vec2(n1*os,0.);
    og += vec2(n2*os,0.);
    ob += vec2(0.,n3*os);
  
    float r = color(iChannel0,uv + or).r;
    float g = color(iChannel0,uv + og).g;
    float b = color(iChannel0,uv + ob).b;
    vec3 color = vec3(r,g,b);
    return color;
    #else 
    return texture(iChannel0,uv).rgb;
    #endif
}

vec2 uv_ybug(vec2 uv){
    float n4 = clamp(noise(200.0+iTime*2.)*14.,0.,2.);
    uv.y += n4;
    uv.y = mod(uv.y,1.);
    return uv;
}

vec2 uv_hstrip(vec2 uv){
    float vnoise = snoise(iTime*6.);
    float hnoise = threshold(snoise(iTime*10.),.5);

    float line = (sin(uv.y*10.+vnoise)+1.)/2.;
    line = (clamp(line,.9,1.)-.9)*10.;
    
    uv.x += line * 0.03 * hnoise;
    uv.x = mod(uv.x,1.);
    return uv;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float t = float(int(iTime * FREQUENCY));
    
    vec2 uv = fragCoord / iResolution.xy;
    
    if(iMouse.z>0.){
        fragColor = texture(iChannel0,uv); 
        return;
    }

    #ifdef CURVE
    uv = uv_curve(uv);
    #endif

    vec2 ouv = uv;
    
    #ifdef GRAINS
    float xn = threshold(snoise(iTime*10.),.7) * 0.05;
    float yn = threshold(snoise((500.0+iTime)*10.),.7) * 0.05;
    
    float r = rand2d(uv+(t+100.0)*.01);
    uv = uv + vec2(xn,yn) * r;
    #endif
    
     
    #ifdef YBUG
    uv = uv_ybug(uv);
    #endif

    #ifdef STRIP
    uv = uv_hstrip(uv);
    #endif
    
   
    vec2 onePixel = vec2(0.0, 1.0) / iResolution.xy * 3.;
    #ifdef BLUR
    vec3 colorA = ghost(iChannel0,uv + onePixel,or,og,ob);
    vec3 colorB = ghost(iChannel0,uv - onePixel,or,og,ob);
    vec3 colorC = ghost(iChannel0,uv,or,og,ob);
    vec3 color = (colorA+colorB+colorC)/3.0;
    #else
    vec3 color = ghost(iChannel0,uv);
    #endif

    //color = colorC;
    
    float scanA = (sin(uv.y*3.1415*iResolution.y/2.7)+1.)/2.;
    float scanB = (sin(uv.y*3.1415*1.)+1.)/2.;
    #ifdef SCANS
    color *= .75 + scanA * .25;
    //color *= .5 + scanC * .5;
    //color *= scanB;    
    #endif
    
    #ifdef BLINK
    float blink = .96 + .04*(sin(iTime*100.)+1.)/2.;
    color *= blink;
    #endif
    
    #ifdef VIG
    float vig = 44.0 * (ouv.x * (1.0-ouv.x) * ouv.y * (1.0-ouv.y));
	vig *= mix( 0.7, 1.0, rand(t + 0.5));
    color *= .6 + .4*vig;
    #endif
     
    #ifdef DIRTY
    color *= 1.0 + rand2d(uv+t*.01) * 0.2;	
    #endif

    vec3 backColor = vec3(.4,.4,.4);
    if (ouv.x < 0.0 || ouv.x > 1.0)
		color = backColor;
	if (ouv.y < 0.0 || ouv.y > 1.0)
		color = backColor;

    fragColor = vec4(color,1.0);
}
`,
    width: -2,
    height: -2,
    iChannel0: {
     filter: 'linear',
     vFlip: true,
   },
 },
};
