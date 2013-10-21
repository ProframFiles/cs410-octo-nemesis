in vec2 vTexCoord;
in vec3 vWorldVertex;
in vec3 vNormal;
in vec3 vTangent;
in vec3 vPlayerCoord;
in vec3 vLightPos;
in vec4 vPointerLoc;
#define NUM_LIGHTS 3
in vec4 vOrangeLights[NUM_LIGHTS];
in vec4 vBlueLights[NUM_LIGHTS];

out vec4 oFragColor;
uniform float uCurrentTime;
uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform vec4 uAmbient;

uniform mat4 uNormalMatrix;
vec3 Y(){
	return vec3(0.0, 1.0, 0.0);
}
vec3 HueToRGB(float hue)
{
	vec3 s = vec3(1.0, -1.0, -1.0);
	return sqrt(clamp(vec3(-1.0,2.0, 2.0)+s*abs(vec3(3.0,2.0, 4.0 )+vec3(-hue*6.0)), 0.0, 1.0));
}
vec3 NormalTransform(vec3 v){
	return (uNormalMatrix*(vec4(v, 0))).xyz;
}

vec4 DebugColor()
{
	return vec4(1.0, 0.0, 1.0, 1.0);
}
vec3 rotate_by_quat(vec3 v, vec4 q)
{
	return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w*v );
}
vec3 reverse_rotate_by_quat(vec3 v, vec4 q)
{
	return v + 2.0 * cross(q.xyz, cross(q.xyz, v) - q.w*v );
}
vec3 Screen(vec3 color, vec3 light )
{
	return 1.0 - (1.0 - color)*(1.0 - light);
}
vec3 Screen(vec3 color, float light)
{
	return Screen(color, vec3(light));
}
//vec3 ToTangentSpace(vec3 v){
//	return vec3(dot(vWorldTangent, v),dot(vWorldBiTangent, v), dot(vWorldNormal, v) );
//}

vec3 Overlay(vec3 color, vec3 light)
{
	vec3 ba = 2.0*light*color;
	vec3 s = sign(ba-color);
	return color+s*min(abs(ba-color), abs(2.0*Screen(color, light)-color));
}
vec3 Overlay(vec3 color, float light)
{
	return Overlay(color, vec3(light));
}
vec3 SoftLight(vec3 color, vec3 light)
{
	 return color*(2.0*light*(1.0-color) + color);
}
vec3 SoftLight(vec3 color, float light)
{
	 return SoftLight(color, vec3(light));
}
vec3 TangentSpace(vec3 v,vec3 worldTangent,vec3 worldBiTangent,vec3 worldNormal){
	return vec3( dot(worldTangent, v),dot(worldBiTangent, v), dot(worldNormal, v) );
}
vec3 PhongLighting(vec3 n, vec3 to_light,vec3 to_eye,vec3 color, vec4 light_color,float len, float ao, float ro, float ss)
{
	float attenuation = 1.0/(1+0.2*len*(1.0+0.15*len));
	float dot_factor = dot(n, to_light.xyz);
	vec3 ret = 4.0*clamp(color*dot_factor*light_color.xyz*attenuation, 0.0, 1.0);
	ret += 1.0*color*(light_color.xyz*ao*attenuation);
	vec3 spec_light = reflect(-to_light*len, n);
	float spec_term = max(dot(to_eye, normalize(spec_light)), 0.0);
	ret += clamp(light_color.xyz*ss*ro*pow(spec_term, 400.0), 0.0, 1.0);
	return clamp(ret, 0.0, 1.0);
}	


void main()
{	
		

	vec3 worldNormal = vNormal.xyz;
	vec3 worldTangent = vTangent.xyz;
	vec3 worldBiTangent = normalize(-cross(worldNormal,worldTangent));


	vec4 diffuse_map = texture2D(uTexture0, vTexCoord);
	vec4 normal_map = texture2D(uTexture1, vTexCoord);
	vec3 tex_normal = normalize(normal_map.xyz-0.5);
	vec4 light_map = texture2D(uTexture2, vTexCoord);

	
	vec3 e = vPlayerCoord - vWorldVertex;
	vec3 v = vLightPos - vWorldVertex;
	float len = length(v);
	vec3 to_light = TangentSpace(v/len, worldTangent,worldBiTangent, worldNormal);
	vec3 to_eye = TangentSpace(normalize(e), worldTangent,worldBiTangent, worldNormal);
	oFragColor.xyz = diffuse_map.xyz*uAmbient.xyz*light_map.x;
	oFragColor.xyz += PhongLighting(tex_normal, to_light,to_eye, diffuse_map.xyz, 0.3*vec4(1.3, 1.3, 1.3, 0.2),len, light_map.x, light_map.y,light_map.z);
	for(int i= 0; i<NUM_LIGHTS ; i++){
		
		v = vOrangeLights[i].xyz - vWorldVertex;
		len = length(v);
		to_light = TangentSpace(v/len, worldTangent,worldBiTangent, worldNormal);
		oFragColor.xyz += PhongLighting(tex_normal, to_light,to_eye,
								 diffuse_map.xyz, vBlueLights[i].w*vec4(.6, 0.6, 0.2,1.0),len, light_map.x, light_map.y, light_map.z);

		v = vBlueLights[i].xyz - vWorldVertex;
		len = length(v);
		to_light = TangentSpace(v/len, worldTangent,worldBiTangent, worldNormal);
		oFragColor.xyz += PhongLighting(tex_normal, to_light,to_eye,
								 diffuse_map.xyz, vBlueLights[i].w*vec4(0.2,0.2,0.6,1.0),len, light_map.x, light_map.y,light_map.z);
	}
	v = vPointerLoc.xyz - vWorldVertex;
	len = length(v);
	to_light = vPointerLoc.w* TangentSpace(v/len, worldTangent,worldBiTangent, worldNormal);
	oFragColor.xyz += PhongLighting(tex_normal, to_light,to_eye,
							diffuse_map.xyz, 0.05*length(e)*vec4(.7, 0.7, 0.7, vPointerLoc.w),len, light_map.x, light_map.y, light_map.z);
	//vec3 back = TangentSpace(NormalTransform(Y()), worldTangent,worldBiTangent, worldNormal);
	oFragColor.a = diffuse_map.a;

	//float t = 0.5*(1.0+dot(vTangent, vec3(vTexCoord,0.0)));
	//oFragColor.xyz = vec3((-tex_normal.y));
	//oFragColor += vec4(smoothstep(0.98, 1.02 , 1.02-fract( vTexCoord.y)));
	//oFragColor += vec4(smoothstep(0.98, 1.02 , 1.02-fract( vTexCoord.x)));
	//oFragColor.xyz = vec3(  , 0.0 );//vec3(0.5*(normalize(back.xyz)+1.0));
	
}
