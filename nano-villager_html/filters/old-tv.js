export default   {
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
};
