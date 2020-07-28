/* global document */
/* global history */
/* global pico8Filter */
/* global URL */
/* global URLSearchParams */
/* global window */

import hq4xShader from './hq4x/hq4x.glsl.js';

const filters = [
  {
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
    }
  },
  {
    name: 'Old Television Frame',
    author: 'Minus256',
    authorUrl: 'https://www.shadertoy.com/user/Minus256',
    src: 'https://www.shadertoy.com/view/XlVczc',
    license: 'CC-BY-NC-SA',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
    filter: {
      fragmentShader: `
      void mainImage( out vec4 fragColor, in vec2 fragCoord )
      {
          vec2 fragCord = abs(fragCoord*2.0-iResolution.xy/1.0);
          float line = pow(fragCord.x/iResolution.x,20.0)+pow((fragCord.y+(iResolution.x-iResolution.y))/iResolution.x,20.0);
          float minphase = abs(0.02*sin(iTime*10.0)+0.2*sin(fragCoord.y));
          float frame = max(min(line+minphase,1.0),0.0);
          
          
          
      //------------scene------------//
          vec2 uv = fragCoord / iResolution.xy;
          vec4 Color = texture2D(iChannel0, uv);
      //-----------------------------//
        
        
        
          vec4 colorinput = Color; //put fragcolor
          
          fragColor = colorinput - vec4(vec3(frame),0.0);
      }      
      `,
      width: 512,
      height: 512,
      filter: false,
    },
  },
  {
    name: '[liliilli] Old TV',
    author: 'liliilli',
    authorUrl: 'https://www.shadertoy.com/user/liliilli',
    src: 'https://www.shadertoy.com/view/XtKfDK',
    license: 'CC-BY-NC-SA',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
    filter: {
      fragmentShader: `
    const float uIntensity = 0.03; // Frame distortion intensity. 0.02 ~ 0.05 recommended.
    const float uThreshold = 0.85; // 0.75 ~ 0.90 would be recommended.
    const float uMax       = 64.0; // Distortion for edge of threshold.
    const float uMargin    = 8.0;  // Margin.

    float GetOverThreadsholdIntensity(const float a, const float t) {
    	float b = pow(t, 2.0) * (1.0 - (1.0 / uMax));
    	return uMax * pow(a - (t - (t / uMax)), 2.0) + b;
    }

    bool IsOob(const vec2 inputTexCoord) {
    	return inputTexCoord.x > 1.0 || inputTexCoord.y > 1.0
            || inputTexCoord.x < 0.0 || inputTexCoord.y < 0.0;
    }

    vec2 ApplyMargin(const vec2 texel, const float margin) {
        vec2 m = vec2(margin * 4.0) / iResolution.xy;
    	return (texel - 0.5) * (1.0 + m) + 0.5;
    }

    vec3 GetColor(const vec3 inputOffset) {
    	return 0.5 + 0.5 * cos(iTime + (inputOffset * 4.0) + vec3(0, 2, 4));
    }

    float ScaleWithAxis(const float value, const float axis, const float scale) {
    	return (value - axis) * scale + axis;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {	// Normalized pixel coordinates (from 0 to 1)
        vec2 uv = fragCoord/iResolution.xy;
       	float x = uv.x * 2.0 - 1.0;
    	float y = uv.y * 2.0 - 1.0;

        // Distort uv coordinate, and if closer to frame bound, do more distortion.
    	float x_intensity = uIntensity;
    	float y_intensity = uIntensity;
    	if (abs(x) >= uThreshold && abs(y) >= uThreshold) {
    		y_intensity *= GetOverThreadsholdIntensity(abs(x), uThreshold);
    		x_intensity *= GetOverThreadsholdIntensity(abs(y), uThreshold);
    	}
    	else {
    		y_intensity *= pow(x, 2.0);
    		x_intensity *= pow(y, 2.0);
    	}

        // Get texel and apply margin (px)
        float y_offset 	= y_intensity * y;
    	float x_offset 	= x_intensity * x;
        vec2 finalTexel = ApplyMargin(uv + vec2(x_offset, y_offset), uMargin);

        // ShaderToy does not support border (to be out-of-bound black color),
        // so checking texel is out of bound.
        if (IsOob(finalTexel) == false)
        {
            fragColor = texture2D(iChannel0, finalTexel);
                //GetColor(finalTexel.xyx) *
                //ScaleWithAxis(texture2D(iChannel0, finalTexel).r, 1.0, 1.0), 1.0);
        }
    }
      `,
      width: 512,
      height: 512,
      filter: false,
    },
  },
  {
    name: 'Old TV effect',
    author: 'mackycheese21',
    authorUrl: 'https://www.shadertoy.com/user/mackycheese21',
    src: 'https://www.shadertoy.com/view/XldcDf',
    license: 'CC-BY-NC-SA',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
    filter: {
      fragmentShader: `
    float luma(vec4 color){
        return 0.2126*color.x+0.7152*color.y+0.0722*color.z;//OpenGL 4.0 Shading Language Cookbook, page 154
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 uv=fragCoord.xy/iResolution.xy;//iChannelResolution[0].xy;
        vec4 sum=vec4(0.0);
        float num=0.0;
        for(int i=0;i<3;i++){
            vec2 offset=texture2D(iChannel1,mod(vec2(uv.x*124.5523+5230.354323*iTime+2523.254*float(i),uv.y*.5364+624.667*iTime+2523.789*float(i)),1.0)).xy;
            offset-=0.5;
            offset*=1.9;
            sum+=vec4(luma(texture2D(iChannel0,uv+offset)));
            num++;
        }
        fragColor=sum/num;
        //fragColor=texture2D(iChannel0,uv);
    }
      `,
      width: 512,
      height: 512,
      filter: false,
      iChannel1: {
        src: createNoise(256, 256),
        filter: 'mipMap',
        wrap: 'repeat',
        vFlip: true,
      },
    },
  },
  {
    name: 'litch2',
    author: 'Coolok',
    authorUrl: 'https://www.shadertoy.com/user/Coolok',
    src: 'https://www.shadertoy.com/view/4dXBW2',
    license: 'CC-BY-NC-SA',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
    filter: {
      fragmentShader: `
    float sat( float t ) {
    	return clamp( t, 0.0, 1.0 );
    }

    vec2 sat( vec2 t ) {
    	return clamp( t, 0.0, 1.0 );
    }

    //remaps inteval [a;b] to [0;1]
    float remap  ( float t, float a, float b ) {
    	return sat( (t - a) / (b - a) );
    }

    //note: /\\ t=[0;0.5;1], y=[0;1;0]
    float linterp( float t ) {
    	return sat( 1.0 - abs( 2.0*t - 1.0 ) );
    }

    vec3 spectrum_offset( float t ) {
    	vec3 ret;
    	float lo = step(t,0.5);
    	float hi = 1.0-lo;
    	float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
    	float neg_w = 1.0-w;
    	ret = vec3(lo,1.0,hi) * vec3(neg_w, w, neg_w);
    	return pow( ret, vec3(1.0/2.2) );
    }

    //note: [0;1]
    float rand( vec2 n ) {
      return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
    }

    //note: [-1;1]
    float srand( vec2 n ) {
    	return rand(n) * 2.0 - 1.0;
    }

    float mytrunc( float x, float num_levels )
    {
    	return floor(x*num_levels) / num_levels;
    }
    vec2 mytrunc( vec2 x, float num_levels )
    {
    	return floor(x*num_levels) / num_levels;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
    	vec2 uv = fragCoord.xy / iResolution.xy;
        uv.y = uv.y;

    	float time = mod(iTime*100.0, 32.0)/110.0; // + modelmat[0].x + modelmat[0].z;

    	float GLITCH = 0.1 + iMouse.x / iResolution.x;

    	float gnm = sat( GLITCH );
    	float rnd0 = rand( mytrunc( vec2(time, time), 6.0 ) );
    	float r0 = sat((1.0-gnm)*0.7 + rnd0);
    	float rnd1 = rand( vec2(mytrunc( uv.x, 10.0*r0 ), time) ); //horz
    	//float r1 = 1.0f - sat( (1.0f-gnm)*0.5f + rnd1 );
    	float r1 = 0.5 - 0.5 * gnm + rnd1;
    	r1 = 1.0 - max( 0.0, ((r1<1.0) ? r1 : 0.9999999) ); //note: weird ass bug on old drivers
    	float rnd2 = rand( vec2(mytrunc( uv.y, 40.0*r1 ), time) ); //vert
    	float r2 = sat( rnd2 );

    	float rnd3 = rand( vec2(mytrunc( uv.y, 10.0*r0 ), time) );
    	float r3 = (1.0-sat(rnd3+0.8)) - 0.1;

    	float pxrnd = rand( uv + time );

    	float ofs = 0.05 * r2 * GLITCH * ( rnd0 > 0.5 ? 1.0 : -1.0 );
    	ofs += 0.5 * pxrnd * ofs;

    	uv.y += 0.1 * r3 * GLITCH;

        const int NUM_SAMPLES = 20;
        const float RCP_NUM_SAMPLES_F = 1.0 / float(NUM_SAMPLES);

    	vec4 sum = vec4(0.0);
    	vec3 wsum = vec3(0.0);
    	for( int i=0; i<NUM_SAMPLES; ++i )
    	{
    		float t = float(i) * RCP_NUM_SAMPLES_F;
    		uv.x = sat( uv.x + ofs * t );
    		vec4 samplecol = texture2D( iChannel0, uv, -10.0 );
    		vec3 s = spectrum_offset( t );
    		samplecol.rgb = samplecol.rgb * s;
    		sum += samplecol;
    		wsum += s;
    	}
    	sum.rgb /= wsum;
    	sum.a *= RCP_NUM_SAMPLES_F;

    	fragColor.a = sum.a;
    	fragColor.rgb = sum.rgb; // * outcol0.a;
    }
      `,
      width: 512,
      height: 512,
      filter: false,
      iChannel1: {
        src: createNoise(256, 256),
        filter: 'mipMap',
        wrap: 'repeat',
        vFlip: true,
      },
    },
  },
  {
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
  },
  {
    name: 'Distorted TV',
    author: 'ehj1',
    authorUrl: 'https://www.shadertoy.com/user/ehj1',
    src: 'https://www.shadertoy.com/view/ldXGW4',
    license: 'CC-BY-NC-SA',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
    filter: {
      fragmentShader: `
// change these values to 0.0 to turn off individual effects
float vertJerkOpt = 1.0;
float vertMovementOpt = 1.0;
float bottomStaticOpt = 1.0;
float scalinesOpt = 1.0;
float rgbOffsetOpt = 1.0;
float horzFuzzOpt = 1.0;

// Noise generation functions borrowed from: 
// https://github.com/ashima/webgl-noise/blob/master/src/noise2D.glsl

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float staticV(vec2 uv) {
    float staticHeight = snoise(vec2(9.0,iTime*1.2+3.0))*0.3+5.0;
    float staticAmount = snoise(vec2(1.0,iTime*1.2-6.0))*0.1+0.3;
    float staticStrength = snoise(vec2(-9.75,iTime*0.6-3.0))*2.0+2.0;
	return (1.0-step(snoise(vec2(5.0*pow(iTime,2.0)+pow(uv.x*7.0,1.2),pow((mod(iTime,100.0)+100.0)*uv.y*0.3+3.0,staticHeight))),staticAmount))*staticStrength;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

	vec2 uv =  fragCoord.xy/iResolution.xy;
	
	float jerkOffset = (1.0-step(snoise(vec2(iTime*1.3,5.0)),0.8))*0.05;
	
	float fuzzOffset = snoise(vec2(iTime*15.0,uv.y*80.0))*0.003;
	float largeFuzzOffset = snoise(vec2(iTime*1.0,uv.y*25.0))*0.004;
    
    float vertMovementOn = (1.0-step(snoise(vec2(iTime*0.2,8.0)),0.4))*vertMovementOpt;
    float vertJerk = (1.0-step(snoise(vec2(iTime*1.5,5.0)),0.6))*vertJerkOpt;
    float vertJerk2 = (1.0-step(snoise(vec2(iTime*5.5,5.0)),0.2))*vertJerkOpt;
    float yOffset = abs(sin(iTime)*4.0)*vertMovementOn+vertJerk*vertJerk2*0.3;
    float y = mod(uv.y+yOffset,1.0);
    
	
	float xOffset = (fuzzOffset + largeFuzzOffset) * horzFuzzOpt;
    
    float staticVal = 0.0;
   
    for (float y = -1.0; y <= 1.0; y += 1.0) {
        float maxDist = 5.0/200.0;
        float dist = y/200.0;
    	staticVal += staticV(vec2(uv.x,uv.y+dist))*(maxDist-abs(dist))*1.5;
    }
        
    staticVal *= bottomStaticOpt;
	
	float red 	=   texture2D(	iChannel0, 	vec2(uv.x + xOffset -0.01*rgbOffsetOpt,y)).r+staticVal;
	float green = 	texture2D(	iChannel0, 	vec2(uv.x + xOffset,	  y)).g+staticVal;
	float blue 	=	texture2D(	iChannel0, 	vec2(uv.x + xOffset +0.01*rgbOffsetOpt,y)).b+staticVal;
	
	vec3 color = vec3(red,green,blue);
	float scanline = sin(uv.y*800.0)*0.04*scalinesOpt;
	color -= scanline;
	
	fragColor = vec4(color,1.0);
}
      `,
      width: -1,
      height: -1,
    },
  },
  {
    name: 'MattiasCRT ',
    author: 'Mattias',
    authorUrl: 'https://www.shadertoy.com/user/Mattias',
    src: 'https://www.shadertoy.com/view/Ms23DR',
    license: 'CC-BY-NC-SA',
    licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
    filter: {
      fragmentShader: `
// Loosely based on postprocessing shader by inigo quilez, License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

vec2 curve(vec2 uv)
{
	uv = (uv - 0.5) * 2.0;
	uv *= 1.1;	
	uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
	uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
	uv  = (uv / 2.0) + 0.5;
	uv =  uv *0.92 + 0.04;
	return uv;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 q = fragCoord.xy / iResolution.xy;
    vec2 uv = q;
    uv = curve( uv );
    vec3 oricol = texture2D( iChannel0, vec2(q.x,q.y) ).xyz;
    vec3 col;
	float x =  sin(0.3*iTime+uv.y*21.0)*sin(0.7*iTime+uv.y*29.0)*sin(0.3+0.33*iTime+uv.y*31.0)*0.0017;

    col.r = texture2D(iChannel0,vec2(x+uv.x+0.001,uv.y+0.001)).x+0.05;
    col.g = texture2D(iChannel0,vec2(x+uv.x+0.000,uv.y-0.002)).y+0.05;
    col.b = texture2D(iChannel0,vec2(x+uv.x-0.002,uv.y+0.000)).z+0.05;
    col.r += 0.08*texture2D(iChannel0,0.75*vec2(x+0.025, -0.027)+vec2(uv.x+0.001,uv.y+0.001)).x;
    col.g += 0.05*texture2D(iChannel0,0.75*vec2(x+-0.022, -0.02)+vec2(uv.x+0.000,uv.y-0.002)).y;
    col.b += 0.08*texture2D(iChannel0,0.75*vec2(x+-0.02, -0.018)+vec2(uv.x-0.002,uv.y+0.000)).z;

    col = clamp(col*0.6+0.4*col*col*1.0,0.0,1.0);

    float vig = (0.0 + 1.0*16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y));
	col *= vec3(pow(vig,0.3));

    col *= vec3(0.95,1.05,0.95);
	col *= 2.8;

	float scans = clamp( 0.35+0.35*sin(3.5*iTime+uv.y*iResolution.y*1.5), 0.0, 1.0);
	
	float s = pow(scans,1.7);
	col = col*vec3( 0.4+0.7*s) ;

    col *= 1.0+0.01*sin(110.0*iTime);
	if (uv.x < 0.0 || uv.x > 1.0)
		col *= 0.0;
	if (uv.y < 0.0 || uv.y > 1.0)
		col *= 0.0;
	
	col*=1.0-0.65*vec3(clamp((mod(fragCoord.x, 2.0)-1.0)*2.0,0.0,1.0));
	
    float comp = smoothstep( 0.1, 0.9, sin(iTime) );
 
	// Remove the next line to stop cross-fade between original and postprocess
//	col = mix( col, oricol, comp );

    fragColor = vec4(col,1.0);
}
      `,
      width: -1,
      height: -1,
    },
  },
  {
    name: 'hq4x',
    author: 'various',
    authorUrl: 'https://github.com/CrossVR/hqx-shader',
    src: 'https://github.com/CrossVR/hqx-shader',
    license: 'LGPL2.1',
    licenseUrl: 'hq4x/LICENSE.txt',
    filter: {
      fragmentShader: hq4xShader,
      width: -1,
      height: -1,
      iChannel1: {
        src: 'hq4x/hq4x.png',
        wrap: 'clamp',
        filter: 'nearest',
      },
    },
  },
  {
    name: 'low-res roto',
    author: 'gman',
    authorUrl: 'https://greggman.github.io',
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
      width: 128,
      height: 128,
      iChannel0: {
        filter: 'mipmap',
        wrap: 'repeat',
        vFlip: true,
      },
    },
  },
  {
    name: 'hi-res roto',
    author: 'gman',
    authorUrl: 'https://greggman.github.io',
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
  },
];


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

// because the script is before the body 😅
window.onload = function() {
  const srcElem = document.querySelector('#src');
  const authorElem = document.querySelector('#author');
  const licenseElem = document.querySelector('#license');

  function setFilter(ndx) {
    const filterInfo = filters[ndx];
    const {author, authorUrl, src, license, licenseUrl, filter} = filterInfo;
    srcElem.href = src || '';
    authorElem.textContent = author;
    authorElem.href = authorUrl;
    licenseElem.textContent = license;
    licenseElem.href = licenseUrl || '';
    pico8Filter.setFilter(filter);
  }

  let firstFilterNdx = 7;
  const settings = Object.fromEntries(new URLSearchParams(window.location.search).entries());
  if (settings.filter) {
    const index = filters.map(f => f.name).indexOf(settings.filter);
    if (index >= 0) {
      firstFilterNdx = index;
    }
  }


  const selectElem = document.querySelector('.filters select');
  filters.forEach((filter) => {
    const optionElem = document.createElement('option');
    optionElem.innerText = filter.name;
    selectElem.appendChild(optionElem);
  });
  selectElem.selectedIndex = firstFilterNdx;
  setFilter(firstFilterNdx);
  selectElem.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('filter', filters[selectElem.selectedIndex].name);
    history.replaceState(null, '', url.href);
    setFilter(selectElem.selectedIndex);
  });
};

