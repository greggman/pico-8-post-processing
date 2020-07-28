export default {
  name: 'LED Display',
  author: 'CloneDeath',
  authorUrl: 'https://www.shadertoy.com/user/CloneDeath',
  src: 'https://www.shadertoy.com/view/lsSSD1',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  filter: {
    fragmentShader: `
const float pixelHeight = 100.0;
const float num_samples = 10.0;
const float pixel_vsep = 0.5;
const float scanline_speed = 0.1;
const float scanline_decay = 0.5;
const float BarrelPower = 1.01;

vec2 Distort(vec2 p)
{
    float theta  = atan(p.y, p.x);
    float radius = length(p);
    radius = pow(radius, BarrelPower);
    p.x = radius * cos(theta);
    p.y = radius * sin(theta);
    return 0.5 * (p + 1.0);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
    float aspect = iResolution.y / iResolution.x;
    vec2 pixelcount = vec2(pixelHeight / aspect, pixelHeight);
    vec2 pixelsize = 1.0/pixelcount;
    vec2 pixelpos = fragCoord.xy / iResolution.xy;
    vec2 longpixelsize = pixelsize * vec2(1.0, 1.0 + pixel_vsep);
    
    /* Apply barrel distortion */
    vec2 xy = 2.0 * pixelpos - 1.0;
    float d = length(xy);
    //if (d < 1.0)
    {
        pixelpos = Distort(xy);
    }
    
    /* Grab pixel */
    vec2 texpos = pixelpos;
    texpos.xy = floor(texpos.xy / pixelsize) * pixelsize;
    texpos.xy += pixelsize/2.0;
    
    /* Grab color */
    float count = 0.0;
    vec4 color = vec4(0);
    for (float x = 0.0; x <= num_samples; x += 1.0){
    	for (float y = 0.0; y <= num_samples; y += 1.0){
            count ++;
        	color += texture2D(iChannel0, texpos + (vec2(x, y) * pixelsize / num_samples));
    	}   
    }
    color /= count;
    
    /* brighten scanlines */
    float line = mod(-iTime * scanline_speed, 1.0);
    if (abs(pixelpos.y - line) < pixelsize.y / 4.0){
     	color.rgb *= 1.5;   
    }
    
    /* make circular */
    vec2 mod_pos = (mod(pixelpos, pixelsize) / pixelsize) - 0.5;
    color.rgb *= 1.0 - sqrt(mod_pos.x * mod_pos.x + mod_pos.y * mod_pos.y);
    
    /* color shift */
    mod_pos += 0.5;
    color.r *= pow(1.0 - abs(mod_pos.x - 0.25), 2.0);
    color.g *= pow(1.0 - abs(mod_pos.x - 0.5), 2.0);
    color.b *= pow(1.0 - abs(mod_pos.x - 0.75), 2.0);
    color.rgb *= vec3(0.8, 0.75, 0.9);
    color.rgb *= 2.5;
    
    /* edge darken */
    color.rgb *= 0.9 - sqrt(pow((pixelpos - 0.5).x, 2.0));
    
	fragColor = color;
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
