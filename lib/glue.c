#include <node_api.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "glue.h"

#define MAXARGS 10

#define FUNCTION(name) static napi_value name(napi_env env, napi_callback_info info)
#define ARGS napi_status status;\
  size_t argc = MAXARGS;\
  napi_value argv[MAXARGS];\
  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);\
  if (status != napi_ok) {\
    napi_throw_error(env, NULL, "Failed to parse arguments");\
  } \
  napi_value obj = argv[0];

#define INT32(value,dest) dest=0;status = napi_get_value_int32(env, value, &dest)
#define DOUBLE(value,dest) dest=0;status = napi_get_value_double(env, value, &dest)
#define STRING(value,dest) status = napi_get_value_string_utf8(env, value, dest, sizeof(dest), 0)

#define OBJ_NAMED(member, dest) {dest=0;\
  bool has;napi_has_named_property(env, obj, #member, &has);\
  status = !has ? napi_invalid_arg : napi_get_named_property(env, obj, #member, &dest);}

#define OBJ_STRING(member, dest) {napi_value _ttt;\
  status = napi_get_named_property(env, obj, #member, &_ttt);\
  STRING(_ttt, dest);}

#define OBJ_DOUBLE(member, dest) {napi_value _ttt;\
  status = napi_get_named_property(env, obj, #member, &_ttt);\
  DOUBLE(_ttt, dest);}

#define OBJ_INT32(member, dest) {napi_value _ttt;\
  status = napi_get_named_property(env, obj, #member, &_ttt);\
  INT32(_ttt, dest);}

// ADD GLUE entries here for functions that exist in main.c and glue.h
#define PRIMITIVES(F)  F(_update) F(_pen) F(_color) F(_clear) F(_poly) F(_opoly) \
  F(_box) F(_rect) F(_test) F(_disc) F(_circle) F(_vector) \
  F(_oval) F(_ellipse) F(_store) F(_restore) F(_loglevel) \
  F(_transform) F(_shape)
#define PUBLICS(F) F(setup) F(pollInput) F(quit) F(pollAudio) F(feedAudio) F(loadmp3) F(loadpng)

static char *allocString(napi_env env, napi_value value) {
	size_t size=0;
	napi_status status = napi_get_value_string_utf8(env, value, 0, 0, &size);
	if(status!=napi_ok) return 0;
	++size;
	char *p = malloc(size);
	status = napi_get_value_string_utf8(env, value, p, size, 0);
	status = status;
	return p;
}

FUNCTION(_setup) {
	ARGS
	obj = obj;
	int pos = 100;
	int size = 1024;
	int x = 0, y = 0;
	int w = 0, h = 0;
	if(argc>0) INT32(argv[0], x);
	if(argc>1) INT32(argv[1], y);
	if(argc>2) INT32(argv[2], w);
	if(argc>3) INT32(argv[3], h);
	if(!x) x=pos;
	if(!y) y=pos;
	if(!w) w=size;
	if(!h) h=size;
	setup(x,y,w,h);
	return 0;
}
FUNCTION(_pollInput) {
	ARGS
	napi_value res = 0;
	#define MAXTAGS 1024
	struct tag tags[MAXTAGS];
	int count = pollInput(tags, MAXTAGS);
	if(!count) return res;
	int i;
	int any = 0;
	napi_value arr;
	status = napi_create_array(env, &arr);
	napi_value val;
	int eventCount = 0;
	for(i=0;i<count;++i) {
		struct tag *t = tags + i;
		if(!any++) status = napi_create_object(env, &obj);
		int type = t->flags & TAGFLAG_TYPE;
		switch(type) {
		case TAGTYPE_DOUBLE:status = napi_create_double(env, t->value.d, &val);break;
		case TAGTYPE_INT32:status = napi_create_int32(env, t->value.i, &val);break;
		case TAGTYPE_STRING:status = napi_create_string_utf8(env, t->value.s, NAPI_AUTO_LENGTH, &val);break;
		}
		status = napi_set_named_property(env, obj, t->name, val);
//		printf("%20s %20s %d\n", t->name, t->value, t->flags);
		if(t->flags & TAGFLAG_LAST) {
			any = 0;
			status = napi_set_element(env, arr, eventCount++, obj);
		}
	}
	res = arr;
	return res;
}
FUNCTION(_pollAudio) {
	ARGS
	obj = obj;
	napi_value res = 0;
	int v = pollAudio();
	status = napi_create_int32(env, v, &res);
	return res;
}
FUNCTION(_feedAudio) {
	ARGS
	int n=0;
	status = napi_get_array_length(env, obj, (uint32_t *)&n);
	const int max = 4096;
	short buf[max];
	int count = 0;
	if(n>max) n=max;
	while(count<n) {
		napi_value e;
		status = napi_get_element(env, obj, count, &e);
		double val;
		DOUBLE(e, val);
		if(val>1.0) val = 1.0;
		if(val<-1.0) val = -1.0;
		buf[count++] = val*32767.5-.5;
	}
	int v = feedAudio(buf, count>>1);
	napi_value res = 0;
	status = napi_create_int32(env, v, &res);
	return res;
}
FUNCTION(_loadmp3) {
	ARGS
	obj = obj;
	napi_value res = 0;
	if(argc==0) return res;
	char name[1024]={0};
	STRING(argv[0], name);
	struct audioRec *ar = loadMP3(name);
	if(!ar) return res;
	status = napi_create_object(env, &res);
	napi_value val;
	void addint32(char *name, int value) {
		status = napi_create_int32(env, value, &val);
		status = napi_set_named_property(env, res, name, val);
	}
	addint32("sampleCount", ar->sampleCount);
	addint32("channelCount", ar->channelCount);
	addint32("sampleRate", ar->sampleRate);
	int count = ar->sampleCount * ar->channelCount;
	napi_value arr;
	status = napi_create_array(env, &arr);
	int i;
	for(i=0;i<count;++i) {
		status = napi_create_double(env, ar->samples[i], &val);
		status = napi_set_element(env, arr, i, val);
	}
	status = napi_set_named_property(env, res, "samples", arr);
	free(ar);
	return res;
}
FUNCTION(_loadpng) {
	ARGS;
	obj = obj;
	napi_value res = 0;
	if(argc==0) return res;
	char name[1024]={0};
	STRING(argv[0], name);
	char *id;
	int width;
	int height;
	loadpng(name, &width, &height, &id);
//printf("%s %d %d\n", id, width, height);
	if(width && height) {
		status = napi_create_object(env, &res);
		napi_value val;
		void addint32(char *name, int value) {
			status = napi_create_int32(env, value, &val);
			status = napi_set_named_property(env, res, name, val);
		}
		addint32("width", width);
		addint32("height", height);
		status = napi_create_string_utf8(env, id, NAPI_AUTO_LENGTH, &val);
		status = napi_set_named_property(env, res, "id", val);
	}
	return res;
}

static double d1, d2, d3, d4, d5, d6, d7, d8;
static double doubleArr[6];
static int i1;
static char s1[64];
static unsigned char rgb[4];
static int byteList(napi_env env, napi_value from, char *name, unsigned char *put, int len) {
	napi_status status;
	napi_value arr;
	status = napi_get_named_property(env, from, name, &arr);
	int n=0;
	status = napi_get_array_length(env, arr, (uint32_t *)&n);
	status = status;
	if(n<len) len=n;
	int i;
	for(i=0;i<len;++i) {
		napi_value e;
		status = napi_get_element(env, arr, i, &e);
		int32_t val;
		INT32(e, val);
		put[i] = val;
	}
	return len;
}

static int doubleList(napi_env env, napi_value from, char *name, double *put, int len) {
	napi_status status;
	napi_value arr;
	if(name)
		status = napi_get_named_property(env, from, name, &arr);
	else
		arr = from;
	int n=0;
	status = napi_get_array_length(env, arr, (uint32_t *)&n);
	status = status;
	if(n<len) len=n;
	int i;
	for(i=0;i<len;++i) {
		napi_value e;
		status = napi_get_element(env, arr, i, &e);
		double val;
		DOUBLE(e, val);
		put[i] = val;
	}
	return len;
}

FUNCTION(_gClear) {
	ARGS;
	obj = obj;
	napi_value res = 0;
	double rgba[4] = {0, 0, 0, 1};
	doubleList(env, obj, "rgb", rgba, 4);
	gClear(rgba);
	return res;
}

FUNCTION(_gCompile) {
	ARGS;
	obj = obj;
	napi_value res = 0;
	char *vs = allocString(env, argv[0]);
	if(!vs) {
		printf("gfx.g.compile invalid first argument\n");
		return res;
	}
	char *fs = allocString(env, argv[1]);
	if(!fs) {
		free(vs);
		printf("gfx.g.compile invalid second argument\n");
		return res;
	}
//	printf("%s\n", vs);
//	printf("%s\n", fs);
	int program = gCompile(vs, fs);
	free(vs);
	free(fs);
	status = napi_create_int32(env, program, &res);
	return res;
}
FUNCTION(_gDraw) {
	ARGS;
	obj = obj;
	napi_value res = 0;
	int prog;
	OBJ_INT32(program, prog);
	if(status!=napi_ok) {printf("Object have a program member from .compile()\n");return res;}
	napi_value attrib;
	OBJ_NAMED(attributes, attrib);
	if(status!=napi_ok) {printf("Object must define the .attributes object\n");return res;}

	napi_value arr;
	OBJ_NAMED(array, arr);
	if(status!=napi_ok) {printf("Object must define the .array object\n");return res;}

	napi_value ndx;
	OBJ_NAMED(indexes, ndx);

	napi_value unif=0;
	OBJ_NAMED(uniforms, unif);

	struct gDraw gd = {0};
	gd.program = prog;

	struct aValue *aList(napi_value obj, int *count) {
		napi_value e;
		status = napi_get_property_names(env, obj, &e);
		uint32_t n=0;
		status = napi_get_array_length(env, e, &n);
		*count = n;
		struct aValue *av = malloc(n*sizeof(struct aValue));
		uint32_t i;
		for(i=0;i<n;++i) {
			napi_value key;
			status = napi_get_element(env, e, i, &key);
			STRING(key, av[i].key);
			napi_value value;
			status = napi_get_named_property(env, obj, av[i].key, &value);
			INT32(value, av[i].value);
//			printf("%d:%s=%d\n", i, av[i].key, av[i].value);
		}
		return av;
	}
	float *getFloats(napi_value o, int *count) {
		uint32_t n=0;
		status = napi_get_array_length(env, o, &n);
		*count = n;
		float *put = malloc(n*sizeof(float));
		uint32_t i;
		for(i=0;i<n;++i) {
			napi_value e;
			status = napi_get_element(env, o, i, &e);
			double val;
			DOUBLE(e, val);
			put[i] = val;
		}
		return put;
	}
	int16_t *getIndexes(napi_value o, int *count) {
		uint32_t n=0;
		status = napi_get_array_length(env, o, &n);
		*count = n;
		int16_t *put = malloc(n*sizeof(int16_t));
		uint32_t i;
		for(i=0;i<n;++i) {
			napi_value e;
			status = napi_get_element(env, o, i, &e);
			int32_t val;
			INT32(e, val);
			put[i] = val;
		}
		return put;
	}
	struct uValue *uList(napi_value obj, int *count) {
		napi_value e;
		status = napi_get_property_names(env, obj, &e);
		uint32_t n=0;
		status = napi_get_array_length(env, e, &n);
		*count = n;
		struct uValue *uv = calloc(n, sizeof(struct uValue));
		uint32_t i;
		for(i=0;i<n;++i) {
			napi_value key;
			status = napi_get_element(env, e, i, &key);
			STRING(key, uv[i].key);
			napi_value arr=0;
			status = napi_get_named_property(env, obj, uv[i].key, &arr);
			napi_typedarray_type type=-1;
			size_t length;
			void *data=0;
			napi_value arraybuffer;
			size_t byteoffset;

			status = napi_get_typedarray_info(env, arr, &type, &length, &data, &arraybuffer, &byteoffset);
			if(status == napi_ok) {
				if(type==napi_float32_array) {
					uv[i].numFloats = length;
					uv[i].array = data;
				} else {
					uv[i].array = &uv[i].single;
					uv[i].numFloats = 1;
					uv[i].single = 0;
				}
			} else {
				bool isArray=0;
				status=napi_is_array(env, arr, &isArray);
				if(isArray) {
					uv[i].mustFree = 1;
					uv[i].array = getFloats(arr, &uv[i].numFloats);
				} else {
					uv[i].array = &uv[i].single;
					uv[i].numFloats = 1;
					double t;
					DOUBLE(arr, t);
					uv[i].single = t;
				}
			}
//			printf("%d:%s=%d %p\n", i, uv[i].key, uv[i].numFloats, uv[i].array);
		}
		return uv;
	}
	gd.attributes = aList(attrib, &gd.numAttributes);
	if(unif) gd.uniforms = uList(unif, &gd.numUniforms);

	gd.array = getFloats(arr, &gd.numFloats);
	if(ndx) gd.indexes = getIndexes(ndx, &gd.numIndexes);

	napi_value type=0;
	OBJ_NAMED(type, type);
	if(type) status = napi_get_value_int32(env, type, &gd.type);
	else gd.type = 5; // TRIANGLE_STRIP

	gDraw(&gd);

	if(gd.uniforms) {
		int i;
		for(i=0;i<gd.numUniforms;++i) {
			if(gd.uniforms[i].mustFree)
				free(gd.uniforms[i].array);
		}
		free(gd.uniforms);
	}
	if(gd.attributes) free(gd.attributes);
	if(gd.array) free(gd.array);
	if(gd.indexes) free(gd.indexes);

	return res;
}


FUNCTION(__test) {
	_test();
	return 0;
}
FUNCTION(__update) {
	_update();
	return 0;
}
FUNCTION(__pen) {
	ARGS
	OBJ_DOUBLE(r, d1);
	_pen(d1);
	return 0;
}
FUNCTION(__color) {
	ARGS
	_color(rgb, byteList(env, obj, "rgb", rgb, 4));
	return 0;
}
FUNCTION(__clear) {
	_clear();
	return 0;
}
FUNCTION(__poly) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_INT32(s, i1);
	OBJ_DOUBLE(r, d3);
	OBJ_DOUBLE(a, d4);
	OBJ_DOUBLE(r2, d5);
	_poly(d1, d2, i1, d3, d4, d5);
	return 0;
}
FUNCTION(__opoly) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_INT32(s, i1);
	OBJ_DOUBLE(r, d3);
	OBJ_DOUBLE(a, d4);
	OBJ_DOUBLE(r2, d5);
	_opoly(d1, d2, i1, d3, d4, d5);
	return 0;
}
FUNCTION(__box) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(dx, d3);
	OBJ_DOUBLE(dy, d4);
	OBJ_DOUBLE(r, d5);
	OBJ_DOUBLE(a, d6);
	_box(d1, d2, d3, d4, d5, d6);
	return 0;
}
FUNCTION(__rect) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(dx, d3);
	OBJ_DOUBLE(dy, d4);
	OBJ_DOUBLE(r, d5);
	OBJ_DOUBLE(a, d6);
	_rect(d1, d2, d3, d4, d5, d6);
	return 0;
}
FUNCTION(__disc) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(r, d3);
	_disc(d1, d2, d3);
	return 0;
}
FUNCTION(__circle) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(r, d3);
	_circle(d1, d2, d3);
	return 0;
}
FUNCTION(__vector) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(x2, d3);
	OBJ_DOUBLE(y2, d4);
	OBJ_DOUBLE(pen, d5);
	_vector(d1, d2, d3, d4, d5);
	return 0;
}
FUNCTION(__oval) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(dx, d3);
	OBJ_DOUBLE(dy, d4);
	OBJ_DOUBLE(a, d5);
	_oval(d1, d2, d3, d4, d5);
	return 0;
}
FUNCTION(__ellipse) {
	ARGS
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(dx, d3);
	OBJ_DOUBLE(dy, d4);
	OBJ_DOUBLE(a, d5);
	_ellipse(d1, d2, d3, d4, d5);
	return 0;
}
FUNCTION(__store) {
	ARGS
	OBJ_STRING(id, s1);
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(x2, d3);
	OBJ_DOUBLE(y2, d4);
	_store(s1, d1, d2, d3, d4);
	return 0;
}
FUNCTION(__restore) {
	ARGS
	OBJ_STRING(id, s1);
	OBJ_DOUBLE(x, d1);
	OBJ_DOUBLE(y, d2);
	OBJ_DOUBLE(w, d3);
	OBJ_DOUBLE(h, d4);
	OBJ_DOUBLE(x1, d5);
	OBJ_DOUBLE(y1, d6);
	OBJ_DOUBLE(x2, d7);
	OBJ_DOUBLE(y2, d8);
	bool has(char *name) {
		bool res;
		napi_has_named_property(env, obj, name, &res);
		return res;
	}
	if(!has("w")) d3=-1;
	if(!has("h")) d4=-1;
	if(!has("x1")) d5=0.;
	if(!has("y1")) d6=0.;
	if(!has("x2")) d7=1.;
	if(!has("y2")) d8=1.;

	_restore(s1, has("x") && has("y"), d1, d2, d3, d4, d5, d6, d7, d8);
	return 0;
}
FUNCTION(__loglevel) {
	ARGS
	OBJ_INT32(loglevel, i1);
	_loglevel(i1);
	return 0;
}
FUNCTION(__transform) {
	ARGS
	_transform(doubleArr, doubleList(env, obj, "m", doubleArr, 6));
	return 0;
}
FUNCTION(__shape) {
	ARGS
	napi_value arr;
	OBJ_NAMED(p, arr);
	if(arr) {
		int len=0;
		status = napi_get_array_length(env, arr, (uint32_t *)&len);
		_shape();
		int i;
		for(i=0;i<len;++i) {
			napi_value e=0;
			status = napi_get_element(env, arr, i, &e);
			if(status || !e) continue;
			bool isArray=0;
			status=napi_is_array(env, e, &isArray);
			if(isArray) {
//				printf("%d: isarray\n", i);
				glue_shape_coords(doubleArr, doubleList(env, e, 0, doubleArr, 6));
			} else {
				napi_valuetype type;
				status = napi_typeof(env, e, &type);
//				printf("%d: type %d\n", i, type);
				glue_shape_rgb(rgb, byteList(env, e, "rgb", rgb, 4));
			}
		}
		glue_shape_end();
	}
	return 0;
}

FUNCTION(_quit) {
	quit(0);
	return 0;
}

static napi_status wrap(napi_env env, napi_value exports, void *func, char *name) {
	napi_status status;
	napi_value fn;

	status = napi_create_function(env, NULL, 0, func, NULL, &fn);
	if (status != napi_ok) {
		napi_throw_error(env, NULL, "Unable to wrap native function");
		return status;
	}

	status = napi_set_named_property(env, exports, name, fn);
	if (status != napi_ok) {
		napi_throw_error(env, NULL, "Unable to populate exports");
	}
	return status;
}

static napi_value Init(napi_env env, napi_value exports) {
#define ADDWRAPPER(x) { _ ## x, #x },
	napi_status status = napi_ok;
	struct wrapper {
		void *func;
		char *name;
	} wrappers[] = {
		PUBLICS(ADDWRAPPER)
		{0}
	};
	struct wrapper *pw;

	pw = wrappers;
	while(pw->func) {
		status = wrap(env, exports, pw->func, pw->name);
		++pw;
	}

	struct wrapper primitives[] = {
		PRIMITIVES(ADDWRAPPER)
		{0}
	};
	napi_value s;
	status = napi_create_object(env, &s);
	pw = primitives;
	while(pw->func) {
		status = wrap(env, s, pw->func, pw->name + 1); // skip the _
		++pw;
	}
	status = napi_set_named_property(env, exports, "s", s);

	napi_value k;
	status = napi_create_object(env, &k);
	struct kdef *kd = kdefs;
	while(kd->name) {
		napi_value val;
		status = napi_create_int32(env, kd->val, &val);
		status = napi_set_named_property(env, k, kd->name, val);
		++kd;
	}
	status = napi_set_named_property(env, exports, "k", k);

	napi_value g;
	status = napi_create_object(env, &g);
	status = wrap(env, g, _gClear, "clear");
	status = wrap(env, g, _gCompile, "compile");
	status = wrap(env, g, _gDraw, "draw");
	status = napi_set_named_property(env, exports, "g", g);

	status = status;

	return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
