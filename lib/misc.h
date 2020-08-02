#define GL_GLEXT_PROTOTYPES 1
#include <SDL_opengl.h>
#include <SDL_opengl_glext.h>
#include <SDL.h>
#include <math.h>
#include "ftgrays.h"
#include "glue.h"

#define M_PI2 (M_PI*2.0)

typedef struct basic_context bc;
typedef struct shape shape;

typedef struct primitive {
	float color[4];
	int spanStart; // byte offset into shape->spans
	int spanCount; // number of spans
} primitive;
#define MAX_SHAPE_PRIMITIVES 32
#define MAX_SHAPE_POINTS 100000
#define MAX_SHAPE_CONTOURS 64
struct shape {
	bc *bc;
	int numpoints;
	int numcontours;
	int pathstops[MAX_SHAPE_CONTOURS];
	FT_Vector  points[MAX_SHAPE_POINTS];
	char tags[MAX_SHAPE_POINTS];
	unsigned char pool[0x100000];
	unsigned char spans[0x100000], *span_put, *span_end;
	primitive primitives[MAX_SHAPE_PRIMITIVES];
	int pcount;
};

struct mybitmap {
	unsigned int glt;
	char name[64];
};
#define MAX_MYBM 8

struct basic_context {
	SDL_Renderer *renderer;
	SDL_Window *window;
	SDL_Texture *font;
	int xsize, ysize;
	int grabcount;

// graphics rendering state
	float color[4];
	double pen; // pen size
	double transform[6];

// shape state
	shape shape;
	struct mybitmap mybm[MAX_MYBM];
};

// render.c

#define TAG_ONPATH    1 // on the path
#define TAG_CONTROL2  0 // quadratic bezier control point
#define TAG_CONTROL3  2 // cubic bezier control point

void update(bc *bc);
void drawchar(bc *bc, int x, int y, int c, int colormode);
void fillScreen(bc *bc, float r, float g, float b, float a);
void drawCircle(bc *bc, double cx, double cy, double radius);
void drawDisc(bc *bc, double cx, double cy, double radius);
void shape_init(bc *bc, shape *shape);
void shape_add(shape *shape, double x, double y, int tag);
void shape_end(shape *shape);
void shape_done(shape *shape);
void shape_primitive(shape *shape, float *color);
void arc_piece(shape *shape, double xc, double yc, double r, double a, double da);
void drawRect(bc *bc, double x, double y, double dx, double dy, double round, double angle);
void drawBox(bc *bc, double x, double y, double dx, double dy, double round, double angle);
void drawVector(bc *bc, double x, double y, double x2, double y2, double r);
void drawOval(bc *bc, double x, double y, double dx, double dy, double angle);
void drawEllipse(bc *bc, double x, double y, double dx, double dy, double angle);
void doStore(bc *bc, const char *id);
void doRestore(bc *bc, const char *id);
void drawPoly(bc *bc, double x, double y, int s, double r, double a, double r2);
void drawOPoly(bc *bc, double x, double y, int s, double r, double a, double r2);
extern int newspanner;
extern int origprog;
void savefullscreen(int texture, int sizex, int sizey);
void fullscreentexture(int texture, int sizex, int sizey, int doblend);
unsigned int genTexture(void);
void deleteTexture(unsigned int);
void setup_gl(void);
extern GLuint msolid, solid_DATA, solid_VIEW, solid_COLOR, solid_SCREENSIZE;
extern GLuint vertex_values;
extern int useFasterShaders;

// main.c
void mylog(char *fmt, ...);

// matrix.c
void mat4_translate(GLfloat *p, float x, float y, float z);
void mat4_rotation(GLfloat *p, float x, float y, float z, float a);
void mat4_identity(GLfloat *p);
void mat4_x_mat4(GLfloat *dest, GLfloat *a, GLfloat *b);
void mat4_scale(GLfloat *p, float f);

