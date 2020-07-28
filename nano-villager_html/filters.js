/* global document */
/* global pico8Filter */
/* global window */


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
    const float uIntensity = 0.03f; // Frame distortion intensity. 0.02 ~ 0.05 recommended.
    const float uThreshold = 0.85f; // 0.75 ~ 0.90 would be recommended.
    const float uMax       = 64.0f; // Distortion for edge of threshold.
    const float uMargin    = 8.0f;  // Margin.

    float GetOverThreadsholdIntensity(const float a, const float t) {
    	float b = pow(t, 2.0f) * (1.0f - (1.0f / uMax));
    	return uMax * pow(a - (t - (t / uMax)), 2.0f) + b;
    }

    bool IsOob(const vec2 inputTexCoord) {
    	return inputTexCoord.x > 1.0f || inputTexCoord.y > 1.0f
            || inputTexCoord.x < 0.0f || inputTexCoord.y < 0.0f;
    }

    vec2 ApplyMargin(const vec2 texel, const float margin) {
        vec2 m = vec2(margin * 4.0f) / iResolution.xy;
    	return (texel - 0.5f) * (1.0f + m) + 0.5f;
    }

    vec3 GetColor(const vec3 inputOffset) {
    	return 0.5f + 0.5f * cos(iTime + (inputOffset * 4.0f) + vec3(0, 2, 4));
    }

    float ScaleWithAxis(const float value, const float axis, const float scale) {
    	return (value - axis) * scale + axis;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {	// Normalized pixel coordinates (from 0 to 1)
        vec2 uv = fragCoord/iResolution.xy;
       	float x = uv.x * 2.0f - 1.0f;
    	float y = uv.y * 2.0f - 1.0f;

        // Distort uv coordinate, and if closer to frame bound, do more distortion.
    	float x_intensity = uIntensity;
    	float y_intensity = uIntensity;
    	if (abs(x) >= uThreshold && abs(y) >= uThreshold) {
    		y_intensity *= GetOverThreadsholdIntensity(abs(x), uThreshold);
    		x_intensity *= GetOverThreadsholdIntensity(abs(y), uThreshold);
    	}
    	else {
    		y_intensity *= pow(x, 2.0f);
    		x_intensity *= pow(y, 2.0f);
    	}

        // Get texel and apply margin (px)
        float y_offset 	= y_intensity * y;
    	float x_offset 	= x_intensity * x;
        vec2 finalTexel = ApplyMargin(uv + vec2(x_offset, y_offset), uMargin);

        // ShaderToy does not support border (to be out-of-bound black color),
        // so checking texel is out of bound.
        if (IsOob(finalTexel) == false)
        {
            fragColor = texture(iChannel0, finalTexel);
                //GetColor(finalTexel.xyx) *
                //ScaleWithAxis(texture(iChannel0, finalTexel).r, 1.0f, 1.0f), 1.0f);
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
            vec2 offset=texture(iChannel1,mod(vec2(uv.x*124.5523+5230.354323*iTime+2523.254*float(i),uv.y*.5364+624.667*iTime+2523.789*float(i)),1.0)).xy;
            offset-=0.5;
            offset*=1.9;
            sum+=vec4(luma(texture(iChannel0,uv+offset)));
            num++;
        }
        fragColor=sum/num;
        //fragColor=texture(iChannel0,uv);
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
    		vec4 samplecol = texture( iChannel0, uv, -10.0 );
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
    }
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

  const firstFilterNdx = 1;

  const selectElem = document.querySelector('.filters select');
  filters.forEach((filter) => {
    const optionElem = document.createElement('option');
    optionElem.innerText = filter.name;
    selectElem.appendChild(optionElem);
  });
  selectElem.selectedIndex = firstFilterNdx;
  setFilter(firstFilterNdx);
  selectElem.addEventListener('change', (e) => {
    setFilter(selectElem.selectedIndex);
  });
};

