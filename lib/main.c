#include <fcntl.h>
#include <unistd.h>
#include <math.h>
#include <sys/time.h>
#include <signal.h>
#include <poll.h>
#include <errno.h>
#include <sys/un.h>
#include <stdarg.h>
//#define PNG_DEBUG 3
#include <png.h>

#include "misc.h"

#define XSIZE 1024
#define YSIZE 1024
SDL_Renderer *renderer = 0;
extern void drawprintfxy(unsigned int x,unsigned int y,char *str,...);
extern void initfont(SDL_Renderer *);

int mousex,mousey;
double centerx, centery;
double scale;
float fps = 0.0;
struct basic_context _ourBC={0}, *ourBC = &_ourBC;

#define INTERVAL_MSEC 20


void transformIdentity(bc *bc) {
	bc->transform[0] = 1.0;
	bc->transform[1] = 0.0;
	bc->transform[2] = 0.0;
	bc->transform[3] = 0.0;
	bc->transform[4] = 1.0;
	bc->transform[5] = 0.0;
}
void initbc(bc *bc, SDL_Renderer *renderer, SDL_Window *window, int xsize, int ysize)
{
	int i;
	for(i=0;i<MAX_MYBM;++i) {
		struct mybitmap *mybm = bc->mybm+i;
		if(mybm->glt)
			glDeleteTextures(1, &mybm->glt);
	}
	memset(bc, 0, sizeof(*bc));
	bc->xsize = xsize;
	bc->ysize = ysize;
	bc->renderer = renderer;
	bc->window = window; // actually serves no purpose...
	bc->pen = scale*.5;
	transformIdentity(bc);
}


float randf(void)
{
	return rand() / (float)RAND_MAX;
}
float randfs(void)
{
	return 2.0 * (randf()-.5);
}

unsigned long gtime(void)
{
	struct timeval now;

	gettimeofday(&now,NULL);
	return now.tv_sec*1000000l + now.tv_usec;
}

void unmaprgbrow(int x, int y, int w, void *data)
{
	SDL_Rect r = {x, y, w, 1};
	SDL_RenderReadPixels(renderer, &r, SDL_PIXELFORMAT_RGB24, data, 3);
}

struct bm {
	int width, height, rowbytes;
	png_byte color_type;
	png_bytep *row_pointers;
};

struct bm *make_bm(int width, int height) {
	struct bm *bm = calloc(sizeof(*bm), 1);
	int y;
	bm->width = width;
	bm->height = height;
	bm->row_pointers = calloc(height, sizeof(void *));
	int w3 = width*3;
	void *p = calloc(w3, height);
	for(y=0;y<height;++y)
		bm->row_pointers[y] = p + w3*y;
	return bm;
}
void free_bm(struct bm *bm) {
	free(bm->row_pointers[0]);
	free(bm->row_pointers);
	free(bm);
}
struct bm *rectToBm(SDL_Rect rect) {
	struct bm *bm = make_bm(rect.w, rect.h);
	if(0) {
		int y;
		for(y=0;y<rect.h;++y) {
			unmaprgbrow(rect.x, rect.y+y, rect.w, bm->row_pointers[y]);
		}
	} else {
		int err = SDL_RenderReadPixels(renderer, &rect, SDL_PIXELFORMAT_RGB24, bm->row_pointers[0], rect.w*3);
		if(err) printf("rectToBM error %d: %s\n", err, SDL_GetError());
	}
	return bm;
}

void writePNG(struct bm *bm, char *name) {
	int w = bm->width;
	int h = bm->height;
	png_structp png_ptr;
	png_infop info_ptr;
	/* create file */
	FILE *fp = fopen(name, "wb");
	if (!fp) return;


	/* initialize stuff */
	png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
	png_set_compression_level(png_ptr, 1);

	info_ptr = png_create_info_struct(png_ptr);


	png_init_io(png_ptr, fp);


//	/* write header */

	png_set_IHDR(png_ptr, info_ptr, w, h,
		     8, PNG_COLOR_MASK_COLOR/*|PNG_COLOR_MASK_ALPHA*/, PNG_INTERLACE_NONE,
		     PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);

	png_write_info(png_ptr, info_ptr);

//	/* write bytes */

	png_write_image(png_ptr, bm->row_pointers);

//	/* end write */

	png_write_end(png_ptr, NULL);

	fclose(fp);
}

void savepng(char *fn, int w, int h) {
	char name[1024];
	int i;
	for(i=0;;++i)
	{
		snprintf(name, sizeof(name), "%s-%04d.png", fn, i);
		int f = open(name, O_RDONLY);
		if(f<0) break;
		close(f);
	}
	mylog("Saving to %s\n", name);
	struct bm *bm;
	bm = rectToBm((SDL_Rect){0, 0, ourBC->xsize, ourBC->ysize});
	writePNG(bm, name);
	free_bm(bm);
}

void saveppm(char *fn, int w, int h)
{
unsigned char temp[w*3];
int f;
int y;
int res;

	char name[1024];
	int i;
	for(i=0;;++i)
	{
		snprintf(name, sizeof(name), "%s-%04d.ppm", fn, i);
		f = open(name, O_RDONLY);
		if(f<0) break;
		close(f);
	}
	f = open(name, O_WRONLY|O_CREAT|O_TRUNC, 0644);
	sprintf((char *)temp, "P6\n%d %d\n255\n", w, h);
	res = write(f, (char *)temp, strlen((char *)temp));
	res = res; //STFU

	for(y=0;y<h;++y)
	{
		unmaprgbrow(0, y, w, temp);
		res = write(f, temp, sizeof(temp));
	}
	close(f);
}

struct state;
struct cmdHandler {
	char *cmd;
	void (*func)(struct state *);
};
struct state {
	int sockfd, cl;
	char inbuffer[1048576];
	int bytesin;
	int debug;
	int loglevel;
	char wbuff[65536];
	unsigned char raw[4096];
	int rawLen;
	struct cmdHandler handlers[100];
	int numHandlers;
} _thestate, *thestate = &_thestate;

#define GAMESOCK "/tmp/jsGFX.sock"

void mylog(char *fmt, ...) {
	va_list ap;
	va_start(ap, fmt);
	vprintf(fmt, ap);
	va_end(ap);
	fflush(stdout);
}
void logmsg(struct state *mst, char *fmt, ...) {
	va_list ap;
	va_start(ap, fmt);
	char temp[4096];
	vsnprintf(temp, sizeof(temp), fmt, ap);
	va_end(ap);
//	simplePair(mst, "log", temp);
}

int canRead(int fd)
{
	struct pollfd pfd;
	pfd.fd = fd;
	pfd.events = POLLIN;
	pfd.revents = 0;
	int n = poll(&pfd, 1, 0);
	return n;
}
static char *sockName = "";
void removeSock(void) {
	unlink(sockName);
}

struct tag *tags;
int tagCount = 0;
int tagMax = 0;

void initTags(struct tag *p, int max) {
	tagCount = 0;
	tags = p;
	tagMax = max;
}

struct tag *nextTag(char *name) {
	if(tagCount>=tagMax-1) return 0;
	struct tag *tag = tags + tagCount++;
	tag->flags = 0;
	snprintf(tag->name, sizeof(tag->name), "%s", name);
	return tag;
}

void addTag(char *name, char *fmt, ...) {
	struct tag *tag = nextTag(name);
	if(!tag) return;
	va_list ap;
	va_start(ap, fmt);
	vsnprintf(tag->value.s, sizeof(tag->value.s), fmt, ap);
	va_end(ap);
}
void addTagDouble(char *name, double v) {
	struct tag *tag = nextTag(name);
	if(!tag) return;
	tag->value.d = v;
	tag->flags |= TAGTYPE_DOUBLE;
}
void addTagInt32(char *name, int v) {
	struct tag *tag = nextTag(name);
	if(!tag) return;
	tag->value.i = v;
	tag->flags |= TAGTYPE_INT32;
}
void endTagGroup(void) {
	if(tagCount>0) tags[tagCount-1].flags |= TAGFLAG_LAST;
}

void keyEvent(struct state *mst, Uint32 ts, int code, int mod, int pressed) {
	addTag("type", "key");
	addTagInt32("ts", ts);
	addTagInt32("code", code);
	addTagInt32("mod", mod);
	addTagInt32("pressed", pressed);
	endTagGroup();
}

void motionEvent(struct state *mst, Uint32 ts, int _x, int _y) {
	addTag("type", "motion");
	addTagInt32("ts", ts);
	addTagDouble("x", (_x - centerx) / scale);
	addTagDouble("y", (centery - _y) / scale);
	endTagGroup();

}

void buttonEvent(struct state *mst, Uint32 ts, int button, int pressed, int _x, int _y) {
	addTag("type", "button");
	addTagInt32("ts", ts);
	addTagInt32("button", button);
	addTagInt32("pressed", pressed);
	addTagDouble("x", (_x - centerx) / scale);
	addTagDouble("y", (centery - _y) / scale);
	endTagGroup();
}

void wheelEvent(struct state *mst, Uint32 ts, int v) {
	addTag("type", "wheel");
	addTagInt32("ts", ts);
	addTagInt32("v", v);
	endTagGroup();
}

static inline double scaleFix(double l) {return l*scale;}
static inline double xFix(double x) {return centerx + scaleFix(x);}
static inline double yFix(double y) {return centery - scaleFix(y);}

//static inline void xyFix(struct state *mst, double *x, double *y, char *xn, char *yn) {
//	bc *bc = ourBC;
//	double tx = getDouble(mst, xn);
//	double ty = getDouble(mst, yn);
//	*x = xFix(tx*bc->transform[0] + ty*bc->transform[1] + bc->transform[2]);
//	*y = yFix(tx*bc->transform[3] + ty*bc->transform[4] + bc->transform[5]);
//}

void _update(void) {
	if(ourBC->grabcount>0) {
		--ourBC->grabcount;
		savepng("/tmp/picsave", ourBC->xsize, ourBC->ysize);
	}
	update(ourBC);
}
void _pen(double v) {
	ourBC->pen = scaleFix(v);
}
void _rgb(float *put, unsigned char *color, int len) {
	int i;
	for(i=0;i<4;++i)
		put[i] = i<len ? color[i]/255.0 : 1.0;
}
void _color(unsigned char *color, int len) {
	_rgb(ourBC->color, color, len);
}
void _clear(void) {
	fillScreen(ourBC, ourBC->color[0], ourBC->color[1], ourBC->color[2], ourBC->color[3]);
}
void _poly(double x, double y, int s, double r, double a, double r2) {
	drawPoly(ourBC, xFix(x), yFix(y), s, scaleFix(r), a, r2);
}
void _opoly(double x, double y, int s, double r, double a, double r2) {
	drawOPoly(ourBC, xFix(x), yFix(y), s, scaleFix(r), a, r2);
}
void _box(double x, double y, double dx, double dy, double r, double a) {
	drawBox(ourBC, xFix(x), yFix(y), scaleFix(dx), scaleFix(dy), scaleFix(r), a);
}
void _rect(double x, double y, double dx, double dy, double r, double a) {
	drawRect(ourBC, xFix(x), yFix(y), scaleFix(dx), scaleFix(dy), scaleFix(r), a);
}
void _test(void) {
	mylog("test\n");
}
void _disc(double x, double y, double r) {
	drawDisc(ourBC, xFix(x), yFix(y), scaleFix(r));
}
void _circle(double x, double y, double r) {
	drawCircle(ourBC, xFix(x), yFix(y), scaleFix(r));
}
void _vector(double x, double y, double x2, double y2, double pen) {
	drawVector(ourBC, xFix(x), yFix(y), xFix(x2), yFix(y2), scaleFix(pen));
}
void _oval(double x, double y, double dx, double dy, double a) {
	drawOval(ourBC, xFix(x), yFix(y),scaleFix(dx), scaleFix(dy), a);
}
void _ellipse(double x, double y, double dx, double dy, double a) {
	drawEllipse(ourBC, xFix(x), yFix(y),scaleFix(dx), scaleFix(dy), a);
}
void _store(char *id) {
	doStore(ourBC, id);
}
void _restore(char *id) {
	doRestore(ourBC, id);
}
void _loglevel(int loglevel) {
	thestate->loglevel = loglevel; // HACK, don't want to refer to it directly
	mylog("loglevel set to %d by client\n", loglevel);
}
void _transform(double *mat, int len) {
	bc *bc = ourBC;
	transformIdentity(bc);
	if(len>6) len=6;
	int i;
	for(i=0;i<len;++i) {
		bc->transform[i] = mat[i];
	}
}

void _shape(void) {
	bc *bc = ourBC;
	shape_init(bc, &bc->shape);
}
void glue_shape_end(void) {
	bc *bc = ourBC;
	shape_done(&bc->shape);
}
void glue_shape_rgb(unsigned char *color, int len) {
	bc *bc = ourBC;
	float temp[4];
	_rgb(temp, color, len);
		shape_primitive(&bc->shape, temp);
}
void glue_shape_coords(double *coords, int len) {
	bc *bc = ourBC;
	len&=~1; // at least pairs...
	if(len==0) {
		shape_end(&bc->shape); // empty element is end of path
		return;
	}
	int tag=-1;
	if(len>6) len=6;
	if(len==4) tag=TAG_CONTROL2;
	else if(len==6) tag=TAG_CONTROL3;
	int j;
	for(j=0;j<len;j+=2)
		shape_add(&bc->shape, xFix(coords[j]), yFix(coords[j+1]), !j ? TAG_ONPATH : tag);
}

//void cmd_shape(struct state *mst) {
//	bc *bc = ourBC;
//	json_object *ref;
//	if(!json_object_object_get_ex(mst->json, "p", &ref)) return;
//	int len = json_object_array_length(ref);
////	mylog("shape len=%d\n", len);
//	if(len<2) return; // must be at least a line...
//	shape_init(bc, &bc->shape);
//	int i;
//	for(i=0;i<len;++i) {
//		json_object *ref2 = json_object_array_get_idx(ref, i);
//		enum json_type type = json_object_get_type(ref2);
//		if(type==json_type_object) {
////			mylog("Member %d is an object\n", i);
//			memset(mst->raw, 255, 4);
//			float color[4];
//			rgb(mst, ref2, color);
//			shape_primitive(&bc->shape, color);
//			continue;
//		} else if(type!=json_type_array) {
//			mylog("Member %d of shape is not an array\n", i);
//			continue;
//		}
//		int l2 = json_object_array_length(ref2);
////		mylog("shape, element %3d length %d\n", i, l2);
//		l2&=~1; // at least pairs...
//		if(l2==0) {
//			shape_end(&bc->shape); // empty element is end of path
//			continue;
//		}
//		int tag=-1;
//		if(l2>6) l2=6;
//		if(l2==4) tag=TAG_CONTROL2;
//		else if(l2==6) tag=TAG_CONTROL3;
//		int j;
//		for(j=0;j<l2;j+=2) {
//			double x = json_object_get_double(json_object_array_get_idx(ref2, j));
//			double y = json_object_get_double(json_object_array_get_idx(ref2, j+1));
////			mylog("Shape, element %3d,%d %lf,%lf\n", i, j/2, x, y);
//			shape_add(&bc->shape, _xFix(x), _yFix(y), !j ? TAG_ONPATH : tag);
//		}
////		mst->raw[i] = json_object_get_int(t);
//	}
//	shape_done(&bc->shape);
//}

struct kdef kdefs[] = {
	{"DEL", SDLK_DELETE},
	{"DELETE", SDLK_DELETE},
	{"DOWN", SDLK_DOWN},
	{"ENTER", SDLK_RETURN},
	{"ESC", SDLK_ESCAPE},
	{"ESCAPE", SDLK_ESCAPE},
	{"INSERT", SDLK_INSERT},
	{"LEFT", SDLK_LEFT},
	{"RETURN", SDLK_RETURN},
	{"RIGHT", SDLK_RIGHT},
	{"UP", SDLK_UP},
	{"F1", SDLK_F1},
	{"F2", SDLK_F2},
	{"F3", SDLK_F3},
	{"F4", SDLK_F4},
	{"F5", SDLK_F5},
	{"F6", SDLK_F6},
	{"F7", SDLK_F7},
	{"F8", SDLK_F8},
	{"F9", SDLK_F9},
	{"F10", SDLK_F10},
	{"F11", SDLK_F10},
	{"F12", SDLK_F12},
	{"LCTRL",  SDLK_LCTRL},
	{"LSHIFT", SDLK_LSHIFT},
	{"LALT",  SDLK_LALT},
	{"LGUI",  SDLK_LGUI},
	{"RCTRL",  SDLK_RCTRL},
	{"RSHIFT",  SDLK_RSHIFT},
	{"RALT",  SDLK_RALT},
	{"RGUI",  SDLK_RGUI},
	{"MOD_LSHIFT", KMOD_LSHIFT},
	{"MOD_RSHIFT", KMOD_RSHIFT},
	{"MOD_LCTRL", KMOD_LCTRL},
	{"MOD_RCTRL", KMOD_RCTRL},
	{"MOD_LALT", KMOD_LALT},
	{"MOD_RALT", KMOD_RALT},
	{"MOD_LGUI", KMOD_LGUI},
	{"MOD_RGUI", KMOD_RGUI},
	{"MOD_NUM", KMOD_NUM},
	{"MOD_CAPS", KMOD_CAPS},
	{"MOD_MODE", KMOD_MODE},
	{"MOD_CTRL", KMOD_CTRL},
	{"MOD_SHIFT", KMOD_SHIFT},
	{"MOD_ALT", KMOD_ALT},
	{"MOD_GUI", KMOD_GUI},
	{"KP0", SDLK_KP_0},
	{"KP1", SDLK_KP_1},
	{"KP2", SDLK_KP_2},
	{"KP3", SDLK_KP_3},
	{"KP4", SDLK_KP_4},
	{"KP5", SDLK_KP_5},
	{"KP6", SDLK_KP_6},
	{"KP7", SDLK_KP_7},
	{"KP8", SDLK_KP_8},
	{"KP9", SDLK_KP_9},
	{"KP_PERIOD", SDLK_KP_PERIOD},
	{"KP_DIVIDE", SDLK_KP_DIVIDE},
	{"KP_MULTIPLY", SDLK_KP_MULTIPLY},
	{"KP_MINUS", SDLK_KP_MINUS},
	{"KP_PLUS", SDLK_KP_PLUS},
	{"KP_ENTER", SDLK_KP_ENTER},
	{"KP_EQUALS", SDLK_KP_EQUALS},
	{0}
};

void initState(struct state *s)
{
	memset(s, 0, sizeof(*s));
}


int xsize, ysize;
SDL_Window *win = NULL;
char *sockname = GAMESOCK;

void resize(int w, int h)
{
	xsize = w;
	ysize = h;
	centerx = w/2.0;
	centery = h/2.0;
	if(centerx > centery)
		scale = centery / 100;
	else
		scale = centerx / 100;
	initbc(ourBC, renderer, win, w, h);
}


#define ABSIZE 8192
short aBuffer[ABSIZE];
int aTake = 0;
int aPut = 0;


#define SAMPLING_RATE 48000
#define FRAGSIZE 1024
// len is a bytecount we need to fill in
void fillAudio(void *data, Uint8 *buffer, int len) {
	Sint16 *p = (void *)buffer;
	int out = 0;
	while(out<len) {
		if(aTake == aPut) {
			*p++ = 0; // left
			*p++ = 0; // right
		} else {
			*p++ = aBuffer[aTake+0];
			*p++ = aBuffer[aTake+1];
			aTake = (aTake+2)%ABSIZE;
		}
		out+=4;
	}
}
int pollAudio(void) {
	int in = aPut - aTake;
	if(in<0) in+=ABSIZE;
	in>>=1; // stereo
	int want = 2*1024-in;
	if(want<0) want=0;
	return want;
}
int feedAudio(short *p, int n) { // n is a count of samples, one for every channel
	int used = 0;
	while(n>0) {
		int t = (aPut+2)%ABSIZE;
		if(t==aTake) break;
		aBuffer[aPut+0] = *p++;
		aBuffer[aPut+1] = *p++;
		aPut = t;
		++used;
		--n;
	}
	return used;
}
void setupAudio(void) {
	SDL_AudioSpec wanted, obtained;
	memset(&wanted,0,sizeof(wanted));
	wanted.freq=SAMPLING_RATE;
	wanted.channels=2;
	wanted.format=AUDIO_S16;
	wanted.samples=FRAGSIZE;
	wanted.callback=fillAudio;
//	wanted.userdata=0;
	if(SDL_OpenAudio(&wanted,&obtained)<0)
	{
		fprintf(stderr,"Couldn't open audio: %s\n",SDL_GetError());
		return;
	}
//	printf("********************** %d\n", obtained.samples);
	SDL_PauseAudio(0);

}

int setup(int xpos, int ypos, int xsize, int ysize) {
	if ( SDL_Init(SDL_INIT_VIDEO | SDL_INIT_TIMER | SDL_INIT_AUDIO) < 0 )
	{
		fprintf(stderr, "Couldn't initialize SDL: %s\n",SDL_GetError());
		return -1;
	}

	setupAudio();
	SDL_GL_SetAttribute(SDL_GL_ALPHA_SIZE, 8);
	win = SDL_CreateWindow("gfxEngine", xpos, ypos, xsize, ysize, SDL_WINDOW_OPENGL | SDL_WINDOW_HIDDEN | SDL_WINDOW_RESIZABLE);

	renderer = SDL_CreateRenderer(win, -1, SDL_RENDERER_ACCELERATED);
	SDL_ShowWindow(win);
	setup_gl();
	initfont(renderer);

	resize(xsize, ysize);

	initState(thestate);

	fillScreen(ourBC, 0.0, 0.0, 0.0, 1.0);
	update(ourBC);
	return 0;
}

int pollInput(struct tag *p, int max) {
	initTags(p, max);
	SDL_Event event;
	while(SDL_PollEvent(&event))
	{
		int code=event.key.keysym.sym;
		Uint32 timestamp = event.common.timestamp;
		int pressed = event.type == SDL_KEYDOWN;pressed=pressed;
		int button = event.button.button;
		int mod = SDL_GetModState();
		int shifted = mod & (KMOD_LSHIFT|KMOD_RSHIFT);shifted=shifted;
		int alted = mod & (KMOD_LALT|KMOD_RALT);alted=alted;
		int eve = event.window.event;

		switch(event.type)
		{
		case SDL_MOUSEMOTION:
			mousex=event.motion.x;
			mousey=event.motion.y;
			motionEvent(thestate, timestamp, mousex, mousey);
			break;
		case SDL_MOUSEBUTTONDOWN:
		case SDL_MOUSEBUTTONUP:
			mousex=event.button.x;
			mousey=event.button.y;
			buttonEvent(thestate, timestamp, button, event.type == SDL_MOUSEBUTTONDOWN,
				mousex, mousey);
			break;
		case SDL_MOUSEWHEEL:
			wheelEvent(thestate, timestamp, event.wheel.y);
			break;
		case SDL_KEYDOWN:
		case SDL_KEYUP:
			if(event.key.repeat) break;
			if(event.type==SDL_KEYDOWN && alted) {
				if(code=='g') ++ourBC->grabcount;//saveppm("/tmp/jsGFX", xsize, ysize);
				if(code=='s') newspanner|=8;
			}
			keyEvent(thestate, timestamp, code, mod, pressed);
//			if(code==SDLK_ESCAPE) quit(0);
			break;
		case SDL_WINDOWEVENT:
			if(eve == SDL_WINDOWEVENT_FOCUS_GAINED) {
//				mylog("Focus gained\n");
			} else if(eve == SDL_WINDOWEVENT_FOCUS_LOST) {
//				mylog("Focus lost\n");
			} else if(eve == SDL_WINDOWEVENT_EXPOSED) {
//				mylog("Exposed\n");
			} else if(eve == SDL_WINDOWEVENT_RESIZED) {
//				mylog("Resized\n");
				resize(event.window.data1, event.window.data2);
				addTag("type", "resize");
				addTagInt32("w", xsize);
				addTagInt32("h", ysize);
				addTagDouble("vw", (xsize-centerx)/scale);
				addTagDouble("vh", (ysize-centery)/scale);
				addTagInt32("ts", timestamp);
				endTagGroup();
			}
			break;

		case SDL_QUIT:
			quit(0);
			break;
		}
	}
	return tagCount;
}
void quit(int code) {
	SDL_Quit();
	exit(code);
}
