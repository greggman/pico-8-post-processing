export default {
  name: 'pinscreen video',
  author: 'szczm_',
  authorUrl: 'https://www.shadertoy.com/user/szczm_',
  src: 'https://www.shadertoy.com/view/wt33W2',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  needsWebGL2: true,
  filter: {
    fragmentShader: `
///////////////////////////////
// TEXT BELOW, OPTIONS FIRST //
///////////////////////////////


// Temporal Anti Aliasing samples. Make it as high as you can! But be careful.
// 12 should be good enough. 128 would be awesome. 1 is for my laptop.
#define TAA_SAMPLES 1

// Comment out to disable Post Processing
//#define PP

// Comment out to disable tonemapping
//#define TONEMAPPING



//////////////////
// TEXT HEEEERE //
//////////////////

/*************************************\

 pinscreen video — saturday sketch #5
  — Matthias Scherba (szczm_)


 This took a lot more than I expected. I had a note that said:
  "pintable shader"
 and I didn't really plan to make it look this good. Sorry :(


 Includes:
 - video pinscreen!
 - nice camera paths
 - nicely commented code because I really like this one
 - Lambert + Blinn-Phong shading
 - temporal antiaiasing... I guess?
 - Reinhardt tonemapping
 - hemispherical ambient occlusion
 - nice post processing


 And I'm surprised how much of this I made without checking external resources.

 Fun fact: there are no shadows, it's just lighting (w/ attenuation) and AO.

 Sad fact: no motion vectors on the video so no real motion blur on the pins :(

 Fun fact: apparently pin art is a patented toy!

 Any questions? Feedback! Let me know!


 Signing out -

 - actually I'm not signing out, who does these days


 P.S.: I wonder if I'm currently holding the record for the total amount of times
       anyone ever listened to this commercial, from start to finish.

 P.S. 2: Now, I'm not saying you should try swapping the video... I'm not. |:

\***************************************************/



//////////////////
// CODE HEREEEE //
//////////////////

const int MAX_STEPS = 150;
const float MIN_DIST = 0.5;
const float MAX_DIST = 20.0;
const float EPSILON = 5e-4;


float time;
// time is a con-
struct DistMat {
    float dist;
    int mat;
};
// ...see what I did there?

    
// SDFunctions
float planeSDF(vec3 p, vec3 n) {
    return length(p) * dot(normalize(p), n);
}

float boxSDF(vec3 p, vec3 b) {
	vec3 q = abs(p) - b;
	return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}


// Gotta fix those for my drivers...
#define TAU 6.28318530718
float sinf(float arg) { return sin(mod(arg, TAU)); }
float cosf(float arg) { return cos(mod(arg, TAU)); }
// ...there.


mat3 rotY(float angle) {
    return mat3(
        vec3(cos(angle), 0.0, sin(angle)),
        vec3(0.0, 1.0, 0.0),
        vec3(-sin(angle), 0.0, cos(angle))
    );
}


// Pin spacing.
const float spacing = 0.04;


// Calculates right coordinates from worldspace and returns a texel of the video.
vec3 getVideoTexel(vec3 p) {
        
    p.x = -p.x;
    p.xz += vec2(3.0, 2.3);
    
   	const vec2 modDomain = vec2(spacing) * 0.5;
    
    vec3 pp = p;
    pp.xz = mod(pp.xz + modDomain, modDomain * 2.0) - modDomain;
    
    // What I'm doing here is called a pro gamer move.
    // we are taking the difference from original coordinates and using it
    // as the UVs. Each box is the same, but each is different. B)
    vec2 uv = (p.xz - pp.xz) * 0.2;
    uv.x *= iChannelResolution[0].y / iChannelResolution[0].x;
    
    vec3 tex = pow(texture(iChannel0, uv).rgb, vec3(2.2));
    
    return tex * step(0.01, uv.x) * step(0.01, 1.0 - uv.x) * step(0.01, uv.y) * step(0.01, 1.0 - uv.y);
}

float luminance(vec3 col) {
    // YUV luminance… I think
    return dot(col, vec3(0.299, 0.587, 0.114));
}


DistMat sum(DistMat a, DistMat b) {
    if (a.dist < b.dist)
		return a;
    else
		return b;
}

DistMat intersect(DistMat a, DistMat b) {
    if (a.dist < b.dist)
        return b;
    else
        return a;
}


DistMat sceneSDF(vec3 p)
{    
    vec3 op = p;
    
    float texel = luminance(getVideoTexel(p));
    
    p.x = -p.x;
    p.xz += vec2(3.0, 2.3);
    
   	const vec2 modDomain = vec2(spacing) * 0.5;
    p.xz = mod(p.xz + modDomain, modDomain * 2.0) - modDomain;
    
    // Pin height in just the right proportions.
    float h = (texel - 0.015) * 0.14;
    
    // Pinscreen
    DistMat scene = DistMat(boxSDF(p - vec3(0.0, h, 0.0), vec3(spacing * 0.4, h, spacing * 0.4)) - 0.004, 0);
    
    // Room
    scene = sum(scene, DistMat(-boxSDF(op - vec3(0.0, 8.0, 0.0), vec3(5.15, 8.0, 5.15)), 1));
    
    // Simple.
    return scene;
}


DistMat shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    int mat = 0;
    int i;
    
    for (i = 0; i < MAX_STEPS; i++) {
        DistMat dist = sceneSDF(eye + depth * marchingDirection);
        
        // Relax, distance. You don't want to miss your opportunities.
        depth += dist.dist * 0.3;
        mat = dist.mat;
        
        // abs prevents premature e...xiting when inside something
        if (abs(dist.dist) < EPSILON) {
			break;
        }
        
        if (depth >= end) {
            depth = end;
            break;
        }
    }
    
    return DistMat(depth, mat);
}      


// Maths. Skip this.
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}


// Cooler maths. But you know this.
vec3 normal(vec3 p, vec3 viewDir) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + EPSILON, p.y, p.z)).dist - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)).dist,
        sceneSDF(vec3(p.x, p.y + EPSILON, p.z)).dist - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)).dist,
        sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)).dist - sceneSDF(vec3(p.x, p.y, p.z - EPSILON)).dist
    ));
}


// Simple hash functions. How do you create a hash function?
// Put it on the screen. Type random numbers until it works good enough.
// Done.
float hash(float i) {
    return fract(sinf(785172.9189*i) * 20412.021401);
}

float hash(vec3 i) {
    return hash(dot(i, vec3(2154.9251, 9253.5219, 5021.2510)));
}


// Not too uniform because the above comment is sadly true.
vec3 randomPointOnHemisphere(vec3 dir, float seed) {
    float a = hash(seed);
    float b = hash(seed + 1.0);
    float c = hash(seed + 2.0);
    
    vec3 point = normalize(-1.0 + 2.0 * vec3(a, b, c));
    
    // Point it in the right direction.
    return point * sign(dot(dir, point));
}


// Hemispherical AO! \o/
float ao(vec3 p, vec3 n) {
    float accu = 0.0;
    float mult = 0.0;
    
    // One sample is enough with TAA and a big viewing distance.
    // I mean the viewport, not the screen. Pfsh.
    for (float i = 0.0; i < 1.0; i++)
    for (float depth = 0.05; depth <= 0.25; depth += 0.05) {
        vec3 dir = normalize(n + randomPointOnHemisphere(n, i + depth * 10.0 + hash(p) + time));
        float dist = sceneSDF(p + depth * dir).dist;
        accu += dist;
        mult += depth;
    }
    
    // Weighted average because yeah.
    return clamp(accu / mult, 0.0, 1.0);
}


// Hmmm.
vec3 lightPosition() {
    return vec3(1.5, 4.0, 1.0);
}

// Huh.
vec3 lightColor() {
    return vec3(1.0, 0.95, 0.9);
}

// Herf.
float lightIntensity() {
    return 50.0;
}


vec3 lighting(in vec3 position, in vec3 normal, in vec2 coords, in vec3 viewDir, in int mat)
{
    vec3 lightPos = lightPosition();
    vec3 lightCol = lightColor();
    
    float lightAtten = lightIntensity() / pow(distance(position, lightPos), 2.0);
    
    // The floor/wall pattern/
    float zig = abs(mod(position.x * 4.0, 2.0) - 1.0) + abs(mod(position.y * 4.0 - 1.0, 2.0) - 1.0) + abs(mod(position.z * 4.0, 2.0) - 1.0);
    zig = step(1.0, zig);
    
    // "Left" is gold, "right" is white "marble".
    vec3 color = mix(vec3(1.0, 0.94, 0.75) * 0.47, vec3(0.72), zig);
    float shininess = mix(0.4, 0.1, zig);
    float roughness = mix(50.0, 0.1, zig);

    // mat 0 is our pinscreen. I'm not really using the material system in the end.
    if (mat == 0) {
        color = getVideoTexel(position) + 0.15;
        roughness = 0.2;
        shininess = 0.05;
    }
        
	// _lighting_
    vec3 lightDir = normalize(lightPos - position);
    
    
    // Diffuse terms, e.g. "I like you as a friend."
    float ndotl = dot(normal, normalize(lightDir));
    
    float diffuseLambert = max(0.0, ndotl);
    
    
    // Specular terms.
    float ndoth = dot(normal, normalize(-viewDir + lightDir));
    float ldotr = dot(lightDir, reflect(viewDir, -normal));
    
    float specularBlinnPhong = pow(max(ndoth, 0.0), roughness);
    float specularPhong = pow(max(ldotr, 0.0), roughness);
    
    
    // Ambient Occlusion
    float ao = ao(position, normal);
    
    
    // Finals. I hate finals.
    // Joking. I finished school. Too cool (B
    
    float ambient = 0.6;
    float diffuse = diffuseLambert * (1.0 - ambient);
    
    // You can swap specularBlinnPhong for specularPhong. That's your decision.
    float specular = specularBlinnPhong * shininess;

    
    // Uncomment and play with the below line to check out specific terms!
    // return vec3(ao);
    
    
    // aaand boom.
    return vec3(ambient * color + (diffuse * color + specular) * ao * lightAtten) * lightCol;
}


// Boring maths again
mat4 viewMatrix(vec3 eye, vec3 center, vec3 up) {
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat4(
        vec4(s, 0.0),
        vec4(u, 0.0),
        vec4(-f, 0.0),
        vec4(0.0, 0.0, 0.0, 1)
    );
}


float getTake() {
    const float take_duration = 9.0;
    const float take_count = 3.0;
    
    // Uncomment below line to force a take!
    // return 1.0;
    
    return float(int(mod(time / take_duration, take_count) * take_duration) / int(take_duration));
}

vec3 getEye() {
    vec3 eye1 = rotY(0.65 + sinf(1.0 * time * TAU * 0.02) * 0.5) * vec3(-3.0, 7.0, -4.0);
    vec3 eye2 = rotY(time * 0.15) * vec3(3.0, 0.8, 2.0);
    vec3 eye3 = vec3(sin(time * 0.2) * 4.5, 2.0, cos(time * 0.2) * 1.0);
    // Three-eyed beast.
    
    
    float take = getTake();
    
    vec3 eye = mix(eye1, eye2, step(1.0, take));
    eye = mix(eye, eye3, step(2.0, take));
    
    return eye;
}

float getFov() {
    float take = getTake();
    
    float fov = mix(60.0, 90.0, step(1.0, take));
    fov = mix(fov, 30.0, step(2.0, take));
    
    return fov;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // This global variable is what makes the TAA tick.
    time = iTime;

    
    // The left one, or the right one? I hope the right one.
    
    vec2 coord = fragCoord / iResolution.xy;
    
    vec3 color = vec3(0.0);
    
    float dt = 0.0;
    float da = 0.0;
    
    
    // Just for safety.
    float tTime = iTime;
    
    
    #define DS float(TAA_SAMPLES)
    #define DDT 0.001
    
    // Let's play with time.
    for (dt = -DS*0.5*DDT; dt < DS*0.5*DDT; dt += DDT)
    {
        // Angle by which a sample will be offset
        da = dt / DDT;

        
        // Wheeee~
        time = tTime + dt;
        

        // Every game needs it.
        vec3 cameraShake = vec3(cosf(time * 3.3), sinf(time * 3.7), cosf(time * 4.3)) * 0.015 * (getFov() / 60.0);
        // getFov() / 60.0 is just to weaken the shake for smaller FoVs
        
        vec3 eye = getEye() + cameraShake;
        mat4 viewToWorld = viewMatrix(eye, vec3(0.0, -0.5, 0.0) + cameraShake, vec3(0.0, 1.0, 0.0));

        // Offset the sample a bit for every sample, free AA! \o/
        vec2 sampleOffset = vec2(cos(da), sin(da)) * 0.4;

        vec3 viewDir = rayDirection(getFov(), iResolution.xy, fragCoord.xy + sampleOffset);
        vec3 worldDir = (viewToWorld * vec4(viewDir, 0.0)).xyz;
        
        
        // Hit it!
        DistMat hitInfo = shortestDistanceToSurface(eye, worldDir, MIN_DIST, MAX_DIST);

        
        // Magenta helps every time.
        vec3 c = vec3(1.0, 0.0, 1.0);

        if (hitInfo.dist < MAX_DIST)
        {    
            vec3 p = eye + hitInfo.dist * worldDir;
            vec3 n = normal(p, worldDir);

            c = lighting(p, n, fragCoord.xy / iResolution.xy, worldDir, hitInfo.mat);
        }

        color += c;
    }
    
    
    // I wrote this a long time ago and for most values of DS it just works soooo
    color /= DS;
    
    
    float l = luminance(color);
    
#ifdef TONEMAPPING
    l *= 4.0;
    l /= 1.0 + l;
    
    // That's Reinhardt tonemapping... I think
    color /= l;
#endif
    
#ifdef PP
    // Cool hue changing vignette
    color = pow(color, mix(vec3(1.0), vec3(1.0, 1.1, 1.25), 0.1 + length(coord - 0.5)));
    
    // Cool DARKNESS vignette
    color *= mix(1.0, 0.5, pow(length(coord - 0.5), 2.0));
    
    // Cool grain- okay, noise.
    color += 0.1 * pow(1.0 - l, 1.5) * hash(vec3(coord, time));
    
    // Cool.
    color = mix(color, vec3(1.0), 0.05);
#endif

    
    // Throw it out!
	fragColor = vec4(color, 1.0);
}
    `,
    width: -1,
    height: -1,
    iChannel0: {
      filter: 'linear',
      vFlip: true,
    },
  },
};
