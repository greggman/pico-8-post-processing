export default  {
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
};
