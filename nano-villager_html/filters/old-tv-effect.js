export default {
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
