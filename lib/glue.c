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
  status = napi_get_named_property(env, obj, #member, &dest);}

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
#define PUBLICS(F) F(setup) F(pollInput) F(quit) F(pollAudio) F(feedAudio) F(loadmp3)

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

static double d1, d2, d3, d4, d5, d6;
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
	_store(s1);
	return 0;
}
FUNCTION(__restore) {
	ARGS
	OBJ_STRING(id, s1);
	_restore(s1);
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

	status = status;

	return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
