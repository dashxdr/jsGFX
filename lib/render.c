/*
   dashxdr@gmail.com
*/
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <fcntl.h>
#include <unistd.h>

#include "misc.h"

#include "binaries.h"

typedef struct span {
	short x;
	short y;
	short coverage;
	short w;
} span;
typedef struct {
	void (*setup)(bc *bc);
	void (*render)(shape *shape, primitive *primitive);
	void (*finish)(bc *bc);
} spanEngine;

void blend_onoff(bc *bc, int onoff)
{
	SDL_SetRenderDrawBlendMode(bc->renderer, onoff ? SDL_BLENDMODE_BLEND :
			SDL_BLENDMODE_NONE);
}

GLint origprog;
int useFasterShaders = 1;

static GLint s1_blendSrc, s1_blendDst, s1_prog, s1_blend;
static float s1_color[4];
static int s1_saved=0, s1_ran=0;

static void spanner1_setup(bc *bc) {
	if(s1_saved) {
//		glBlendFunc(s1_blendSrc, s1_blendDst);
		glUseProgram(s1_prog);
//		if(s1_blend)
//			glEnable(GL_BLEND);
//		else
//			glDisable(GL_BLEND);
		glColor4fv(s1_color);
	}
	blend_onoff(bc, 1);
}

static void spanner1_render(shape *shape, primitive *primitive)
{
	int count = primitive->spanCount;
	if(!count) return;

	bc *bc=shape->bc;
	Uint32 r,g,b,a, f;

	float *color = primitive->color;
	r=255*color[0];
	g=255*color[1];
	b=255*color[2];
	a=255*color[3];
	s1_ran=1;
	span *sp = (void *)(shape->spans + primitive->spanStart);
	while(count--)
	{
		f = ((sp->coverage+1)*a)>>8;
		SDL_SetRenderDrawColor(bc->renderer, r, g, b, f);
		SDL_Rect r = {sp->x, sp->y, sp->w, 1};
		SDL_RenderFillRect(bc->renderer, &r);
		++sp;
	}
}

static void spanner1_finish(bc *bc) {
	if(s1_ran && !s1_saved) {
		glGetIntegerv(GL_BLEND_SRC_ALPHA, &s1_blendSrc);
		glGetIntegerv(GL_BLEND_DST_ALPHA, &s1_blendDst);
		glGetIntegerv(GL_CURRENT_PROGRAM, &s1_prog);
		glGetIntegerv(GL_BLEND, &s1_blend);
		glGetFloatv(GL_CURRENT_COLOR, s1_color);
		s1_saved=1;
//mylog("blendSrc=%d,blendDst=%d,prog=%d,blend=%d\n", s1_blendSrc, s1_blendDst, s1_prog, s1_blend);
	}
	blend_onoff(bc, 0);
}

spanEngine spanner1 = {
	setup: spanner1_setup,
	render: spanner1_render,
	finish: spanner1_finish,
};

static void spanner2_setup(bc *bc) {}
static void spanner2_finish(bc *bc) {}

static void spanner2_render(shape *shape, primitive *primitive) {
	bc *bc = shape->bc;
	void *vd = shape->spans + primitive->spanStart;
	int vdsize = primitive->spanCount*sizeof(span);

//	GLint saveprog;
//	glGetIntegerv(GL_CURRENT_PROGRAM, &saveprog);
	glUseProgram(msolid);
	glDisable(GL_DEPTH_TEST);

	glUniform4fv(solid_COLOR, 1, primitive->color);
	glUniform2f(solid_SCREENSIZE, bc->xsize, bc->ysize);

//mylog("%d %d %d\n", solid_DATA, solid_COLOR, solid_SCREENSIZE);

	glBindBuffer(GL_ARRAY_BUFFER, vertex_values);
	glBufferData(GL_ARRAY_BUFFER, vdsize, vd, GL_STATIC_DRAW);
	glEnableVertexAttribArray(solid_DATA);
	glVertexAttribPointer(solid_DATA, 4, GL_SHORT, GL_FALSE,
			sizeof(span), 0);
	glDisable(GL_COLOR_LOGIC_OP);
	if(0)
		glDisable(GL_BLEND);
	else
	{
		glEnable(GL_BLEND);
		glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
	}
	glDisable(GL_DEPTH_TEST);
	glDisable(GL_CULL_FACE);
	glDisable(GL_NORMALIZE);

	glDrawArrays(GL_POINTS, 0, primitive->spanCount);

//	glUseProgram(saveprog);
}
spanEngine spanner2 = {
	setup: spanner2_setup,
	render: spanner2_render,
	finish: spanner2_finish,
};



//	int sizex = bc->xsize;
//	int sizey = bc->ysize;
//	int mousex = sizex/2;
//	int mousey = sizey/2;
//	float zoom=1.0;
//	GLfloat view[16];
//	mat4_identity(view);
//	mat4_translate(view, 0.0, 0.0, -5.0);
//	GLfloat temp[16];
//	mat4_rotation(temp, 0.0, 0.0, 1.0, mousex-sizex/2+90.0);
//	mat4_x_mat4(view, temp, view);
//	mat4_rotation(temp, 1.0, 0.0, 0.0, mousey-sizey/2-90.0);
//	mat4_x_mat4(view, temp, view);
//
//	mat4_scale(view, .1*zoom);
////	mat4_translate(view, 0.0, -0.5, 0.0);
//	glUniformMatrix4fv(solid_VIEW, 1, 0, view);

void fillScreen(bc *bc, float r, float g, float b, float a)
{
	glClearColor(r, g, b, a);
	glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
}

void drawchar(bc *bc, int x, int y, int c, int colormode)
{
	c &= 0x7f;
	if(c<' ' || c>=128)
		return;
	c -= ' ';

	SDL_Rect rs, rd;

	rs.x = 8*(c&15);
	rs.y = 13*(c>>4) + colormode*128;
	rs.w = 6;
	rs.h = 13;

	rd.x = x;
	rd.y = y;
	rd.w = 6;
	rd.h = 13;
	SDL_RenderCopy(bc->renderer, bc->font, &rs, &rd);
}


void update(bc *bc)
{
	SDL_RenderPresent(bc->renderer);
}

void oval_piece(shape *shape, double xc, double yc, double dx, double dy, double a, double da, double rot)
{
double x1,y1,x2,y2,x3,y3,x4,y4;
double q1,q2,k2,ax,ay,bx,by;
#define AP_STEPS 3
int i;

	a*=M_PI/180.0;
	da*=M_PI/180.0;
	rot*=M_PI/180.0;
	double s = sin(rot);
	double c = cos(rot);

	double u00, u01, u10, u11;
	u00 = dx*c;
	u01 = dy*s;
	u10 = -dx*s;
	u11 = dy*c;	

	if(da>M_PI2) da=M_PI2;
	if(da<-M_PI2) da=-M_PI2;
	da/=AP_STEPS;
	for(i=0;i<AP_STEPS;++i)
	{
		ax=cos(a);
		ay=sin(a);
		a+=da;
		bx=cos(a);
		by=sin(a);

		x1=ax;
		y1=ay;
		x4=bx;
		y4=by;

		q1=ax*ax + ay*ay;
		q2=q1 + ax*bx + ay*by;
		k2 = 4.0/3.0*((sqrt(2.0*q1*q2)-q2)/(ax*by-ay*bx));
		x2=x1 - k2*ay;
		y2=y1 + k2*ax;
		x3=x4 + k2*by;
		y3=y4 - k2*bx;

		shape_add(shape, xc+u00*x1+u01*y1, yc+u10*x1+u11*y1, TAG_ONPATH);
		shape_add(shape, xc+u00*x2+u01*y2, yc+u10*x2+u11*y2, TAG_CONTROL3);
		shape_add(shape, xc+u00*x3+u01*y3, yc+u10*x3+u11*y3, TAG_CONTROL3);
		if(i+1==AP_STEPS)
			shape_add(shape, xc+u00*x4+u01*y4, yc+u10*x4+u11*y4, TAG_ONPATH);
	}
}

void arc_piece(shape *shape, double xc, double yc, double r, double a, double da) {
	oval_piece(shape, xc, yc, r, r, a, da, 0.0);
}


void drawCircle(bc *bc, double cx, double cy, double radius)
{
	shape_init(bc, &bc->shape);
#define T1 0
#define T2 360
	arc_piece(&bc->shape, cx, cy, radius+bc->pen, T1,T2);
	arc_piece(&bc->shape, cx, cy, radius-bc->pen, T1+T2, -T2);
	shape_done(&bc->shape);
}

void drawDisc(bc *bc, double cx, double cy, double radius)
{
	shape_init(bc, &bc->shape);
	arc_piece(&bc->shape, cx, cy, radius, 0, 360);
	shape_done(&bc->shape);
}

void drawOval(bc *bc, double cx, double cy, double dx, double dy, double angle) {
	shape_init(bc, &bc->shape);
	oval_piece(&bc->shape, cx, cy, dx, dy, 0, 360, angle);
	shape_done(&bc->shape);
}
void drawEllipse(bc *bc, double cx, double cy, double dx, double dy, double angle) {
	dx = fabs(dx);
	dy = fabs(dy);
	double pen = bc->pen;
	shape_init(bc, &bc->shape);
	oval_piece(&bc->shape, cx, cy, dx+pen, dy+pen, 0, 360, angle);
	shape_end(&bc->shape);
	dx-=pen;
	dy-=pen;
	if(dx>0.0 && dy>0.0)
		oval_piece(&bc->shape, cx, cy, dx, dy, 0, 360, angle);
	shape_done(&bc->shape);
}


static void _Rect(bc *bc, double x, double y, double dx, double dy, double round, double angle) {
	dx = fabs(dx);
	dy = fabs(dy);
	if(round<0.0) round=0.0;
	if(round>dx) round=dx;
	if(round>dy) round=dy;
	dx-=round;
	dy-=round;

	double a = angle*.017453293; // degrees to radians
	double c = cos(a);
	double s = sin(a);
	double dx1 = dx*c;
	double dy1 = -dx*s;
	double dx2 = dy*s;
	double dy2 = dy*c;

	if(round>0.0) {
		arc_piece(&bc->shape, x-dx1-dx2, y+dy1+dy2, round, angle+180, -90); // -1 -2
		arc_piece(&bc->shape, x+dx1-dx2, y-dy1+dy2, round, angle+90, -90); // +1 -2
		arc_piece(&bc->shape, x+dx1+dx2, y-dy1-dy2, round, angle, -90); // +1 +2
		arc_piece(&bc->shape, x-dx1+dx2, y+dy1-dy2, round, angle+270, -90); // -1 +2
	} else {
		shape_add(&bc->shape, x-dx1-dx2, y+dy1+dy2, TAG_ONPATH);
		shape_add(&bc->shape, x+dx1-dx2, y-dy1+dy2, TAG_ONPATH);
		shape_add(&bc->shape, x+dx1+dx2, y-dy1-dy2, TAG_ONPATH);
		shape_add(&bc->shape, x-dx1+dx2, y+dy1-dy2, TAG_ONPATH);
	}
}
void drawRect(bc *bc, double x, double y, double dx, double dy, double round, double angle) {
	shape_init(bc, &bc->shape);
	double pen = bc->pen;
	_Rect(bc, x, y, dx+pen, dy+pen, round, angle);
	shape_end(&bc->shape);
	_Rect(bc, x, y, dx-pen, dy-pen, round, angle);
	shape_done(&bc->shape);
}

void drawBox(bc *bc, double x, double y, double dx, double dy, double round, double angle) {
	shape_init(bc, &bc->shape);
	_Rect(bc, x, y, dx, dy, round, angle);
	shape_done(&bc->shape);
}

static void _Poly(bc *bc, double x, double y, int s, double r, double angle, double r2) {
	double a = angle*.017453293; // degrees to radians
	if(s<3) s=3;
	double da = M_PI2/s;
	double da2 = da / 2;
	double t = r*sqrt(2.0*(1.0 - cos(da))); // distance between 2 vertices
	t*=.5;
	if(r2==0.0) r2 = 1.0;
	r2 *= sqrt(r*r-t*t);

	int i;
	for(i=0;i<s;++i) {
		shape_add(&bc->shape, x+r*cos(a), y+r*sin(a), TAG_ONPATH);
		a+=da2;
		shape_add(&bc->shape, x+r2*cos(a), y+r2*sin(a), TAG_ONPATH);
		a+=da2;
	}
}

void drawPoly(bc *bc, double x, double y, int s, double r, double angle, double r2) {
	shape_init(bc, &bc->shape);
	_Poly(bc, x, y, s, r, angle, r2);
	shape_done(&bc->shape);
}

void drawOPoly(bc *bc, double x, double y, int s, double r, double angle, double r2) {
	double pen = bc->pen;
	shape_init(bc, &bc->shape);
	_Poly(bc, x, y, s, r+pen, angle, r2);
	shape_end(&bc->shape);
	_Poly(bc, x, y, s, r-pen, angle, r2);
	shape_done(&bc->shape);
}

void drawVector(bc *bc, double x, double y, double x2, double y2, double pen) {
	if(x==x2 && y==y2) return;
	double dx = -(y2 - y);
	double dy = x2 - x;
	double f = (pen ? pen : bc->pen) / sqrt(dx*dx + dy*dy);
	dx*=f;
	dy*=f;
	shape_init(bc, &bc->shape);
	shape_add(&bc->shape, x+dx, y+dy, TAG_ONPATH);
	shape_add(&bc->shape, x-dx, y-dy, TAG_ONPATH);
	shape_add(&bc->shape, x2-dx, y2-dy, TAG_ONPATH);
	shape_add(&bc->shape, x2+dx, y2+dy, TAG_ONPATH);
	shape_done(&bc->shape);
}

struct mybitmap *findBM(bc *bc, const char *name) {
	int i;
	for(i=0;i<MAX_MYBM;++i) {
		struct mybitmap *mybm = bc->mybm + i;
		if(!strcmp(mybm->name, name)) return mybm;
	}
	return 0;
}
struct mybitmap *storeBG(bc *bc, const char *id, int forceblack) {
	struct mybitmap *mybm = findBM(bc, id);
	if(!mybm) {
		unsigned int oldt = bc->mybm[MAX_MYBM-1].glt;
		if(oldt==0) oldt = genTexture();
		mybm = bc->mybm;
		memmove(mybm+1, mybm, (MAX_MYBM-1)*sizeof(*mybm));
		snprintf(mybm->name, sizeof(mybm->name), "%s", id);
		mybm->glt = oldt;
	}
	savefullscreen(mybm->glt, bc->xsize, bc->ysize);
	return mybm;
}
void doStore(bc *bc, const char *id) {
	storeBG(bc, id, 0);
}
void doRestore(bc *bc, const char *id) {
	struct mybitmap *mybm = findBM(bc, id);
	if(!mybm) mybm = storeBG(bc, id, 1);
	fullscreentexture(mybm->glt, bc->xsize, bc->ysize, 0);
}

#define IFACTOR 64  // used to fix coords to the grays rendering engine 

void shape_newspan(shape *shape) {
	shape->numpoints = 0;
	shape->numcontours = 0;
}
// 
void shape_init(bc *bc, shape *shape)
{
	shape->bc = bc;
	shape->span_put = shape->spans;
	shape->span_end = shape->span_put + sizeof(shape->spans) - 4096;
	shape->pcount = 0;
	shape_newspan(shape);
	shape_primitive(shape, bc->color);

}

void shape_add(shape *shape, double x, double y, int tag)
{
	double *t = shape->bc->transform;;
	float tx = centerx + scale*(x*t[0] + y*t[1] + t[2]);
	float ty = centery - scale*(x*t[3] + y*t[4] + t[5]);
	if(shape->numpoints < MAX_SHAPE_POINTS)
	{
		shape->points[shape->numpoints].x = IFACTOR * tx;
		shape->points[shape->numpoints].y = IFACTOR * ty;
		shape->tags[shape->numpoints] = tag;
		++shape->numpoints;
	}
}
void shape_end(shape *shape)
{
	if(shape->numcontours < MAX_SHAPE_CONTOURS &&
				shape->numpoints &&
			(!shape->numcontours || 
			shape->numpoints > shape->pathstops[shape->numcontours-1]+1))
	{
		shape->pathstops[shape->numcontours++] = shape->numpoints-1;
	}
}

// convert all the points/paths built up so far into spans
void shape_span(shape *shape) {
	shape_end(shape);
	if(shape->numcontours==0 && shape->numpoints==0) return;
	if(shape->pcount==MAX_SHAPE_PRIMITIVES) return;

	int res;
	FT_Raster myraster;
	FT_Raster_Params myparams;
	FT_Outline myoutline;

	myoutline.n_contours = shape->numcontours;
	myoutline.n_points = shape->numpoints;
	myoutline.points = shape->points;
	myoutline.tags = shape->tags;
	myoutline.contours = shape->pathstops;
	myoutline.flags = FT_OUTLINE_IGNORE_DROPOUTS |
			FT_OUTLINE_EVEN_ODD_FILL;

	void myspanner(int y, int count, FT_Span *spans, void *user) {
		struct shape *shape = user;
		if(shape->span_put >= shape->span_end) return;
		span *sp = (void *)shape->span_put;
		while(count--) {
			sp->x = spans->x;
			sp->y = y;
			sp->coverage = spans->coverage;
			sp->w = spans->len;
			++sp;
			++spans;
		}
		shape->span_put = (void *) sp;
	}

	myparams.target = 0;
	myparams.source = &myoutline;
	myparams.flags = FT_RASTER_FLAG_DIRECT | FT_RASTER_FLAG_AA |
		FT_RASTER_FLAG_CLIP;
	myparams.gray_spans = myspanner;
	myparams.user = shape;
	myparams.clip_box.xMin = 0;
	myparams.clip_box.xMax = shape->bc->xsize;
	myparams.clip_box.yMin = 0;
	myparams.clip_box.yMax = shape->bc->ysize;
	res=SDL_basic_ft_grays_raster.raster_new(0, &myraster);res=res;

	primitive *primitive = shape->primitives + shape->pcount;
	primitive->spanStart = shape->span_put - shape->spans;
	primitive->spanCount = 0;

	SDL_basic_ft_grays_raster.raster_reset(myraster, shape->pool, sizeof(shape->pool));
	res=SDL_basic_ft_grays_raster.raster_render(myraster, &myparams);

	SDL_basic_ft_grays_raster.raster_done(myraster);
	primitive->spanCount = ((shape->span_put - shape->spans) - primitive->spanStart) / 8;
	++shape->pcount;
	shape_newspan(shape);
}

// If shape->numpoints>0 then close out the existing primitive
void shape_primitive(shape *shape, float *color) {
//	mylog("shape_primitive [%f,%f,%f,%f]\n", color[0], color[1], color[2], color[3]);
	shape_span(shape);
	if(shape->pcount >= MAX_SHAPE_PRIMITIVES) return;
	primitive *primitive = shape->primitives + shape->pcount;
	memcpy(primitive->color, color, sizeof(primitive->color));
}

// x, y, coverage, w
void span_merge(shape *shape, primitive *p1, primitive *p2) {
//	mylog("%4d,%4d %4d,%4d\n", p1->spanStart, p1->spanCount, p2->spanStart, p2->spanCount);
	span *sp1 = (void *)(shape->spans + p1->spanStart);
	span *sp2 = (void *)(shape->spans + p2->spanStart);
	span *sp1e = sp1 + p1->spanCount;
	span *sp2e = sp2 + p2->spanCount;
	while(sp1<sp1e && sp2<sp2e) {
		if(sp1->y < sp2->y) {
			++sp1;
			continue;
		}
		if(sp2->y < sp1->y) {
			++sp2;
			continue;
		}
		int left1 = sp1->x;
		int right1 = left1 + sp1->w;
		int left2 = sp2->x;
		int right2 = left2 + sp2->w;
		if(left2 >= left1 &&  right2 <= right1) { // 2 is entirely inside 1
			++sp2;
			continue;
		}
		if(right1 <= left2) { // 1 is entirely left of 2
			++sp1;
			continue;
		}
		if(right2 <= left1) { // 2 is entirely left of 1
			++sp2;
			continue;
		}
// ok we've got 2 spans with same y with some overlap
		mylog("(%d-%d,%d) (%d-%d,%d)\n", sp1->x, sp1->x+sp1->w, sp1->y,
				sp2->x, sp2->x+sp2->w, sp2->y);
		break;
	}
}
int newspanner = 1;
void shape_done(shape *shape)
{
	shape_span(shape);

	bc *bc = shape->bc;

//	if(shape->pcount>1) {
//		span_merge(shape, shape->primitives+0, shape->primitives+1);
//	}

	if(newspanner&8) {
		newspanner^=8+1;
		if(!useFasterShaders) newspanner = 0;
		mylog("Switching to spanner %d\n", newspanner ? 2 : 1);
	}
	spanEngine *e = newspanner ? &spanner2 : &spanner1;

	e->setup(bc);
	int i;
	for(i=0;i<shape->pcount;++i) {
		e->render(shape, shape->primitives+i);
	}
	e->finish(bc);
}

//http://www.allegro.cc/forums/thread/597340
void savefullscreen(int texture, int sizex, int sizey)
{
	GLint saveprog;
	glGetIntegerv(GL_CURRENT_PROGRAM, &saveprog);
	glUseProgram(origprog);
	glEnable(GL_TEXTURE_2D);
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, texture);
	glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST );
	glCopyTexImage2D(GL_TEXTURE_2D,0,GL_RGB,0,0,sizex,sizey,0);
	glUseProgram(saveprog);
}


void fullscreentexture(int texture, int sizex, int sizey, int doblend)
{
	GLint saveprog;
	glGetIntegerv(GL_CURRENT_PROGRAM, &saveprog);
	glUseProgram(origprog);
	glEnable(GL_TEXTURE_2D);
	if(doblend)
		glEnable(GL_BLEND);
	else
		glDisable(GL_BLEND);
	glDisable(GL_LIGHTING);
	glDisable(GL_DEPTH_TEST);
	glDisable(GL_CULL_FACE);
	glActiveTexture(GL_TEXTURE0);
	glBindTexture(GL_TEXTURE_2D, texture);
	float oldcolor[4]={0.0, 0.0, 0.0, 0.0};
	glGetFloatv(GL_CURRENT_COLOR, oldcolor);
	glColor3f(1.0, 1.0, 1.0);

	glPushMatrix();
	glBegin(GL_QUADS);
	glNormal3f(0.0, 0.0, 1.0);
	float x1, y1, x2, y2;
	x1 = 0.0;
	x2 = sizex;
	y1 = sizey;
	y2 = 0.0;
	glTexCoord2f(0.0, 0.0);
	glVertex3f(x1, y1, 0.0);
	glTexCoord2f(1.0, 0.0);
	glVertex3f(x2, y1, 0.0);
	glTexCoord2f(1.0, 1.0);
	glVertex3f(x2, y2, 0.0);
	glTexCoord2f(0.0, 1.0);
	glVertex3f(x1, y2, 0.0);
	glEnd();
	glPopMatrix();
	glUseProgram(saveprog);
	glColor4fv(oldcolor);
}
unsigned int genTexture(void) {
	unsigned int temp;
	glGenTextures(1, &temp);
	return temp;
}

void deleteTexture(unsigned int texture) {
	glDeleteTextures(1, &texture);
}

void showerrors(int shader, char *name)
{
	GLchar errorlog[8192];
	GLsizei len;
	glGetShaderInfoLog(shader, sizeof(errorlog), &len, errorlog);
	if(len)
		mylog("%s:\n%s\n", name, errorlog);
}

int loadShader(int type, char *name, char *data, int size)
{
	GLchar *mem;
	int shader = glCreateShader(type); 
	mem = malloc(size+1);
	memcpy(mem, data, size);
	mem[size] = 0;

	// add the source code to the shader and compile it
	glShaderSource(shader, 1, (const GLchar **)&mem, 0);
	glCompileShader(shader);
	showerrors(shader, name);
	free(mem);

	return shader;
}
GLuint msolid, solid_DATA, solid_VIEW, solid_COLOR, solid_SCREENSIZE;
GLuint vertex_values;

void init_shader_stuff(void)
{
	glGenBuffers(1, &vertex_values);
	msolid = glCreateProgram();
	glAttachShader(msolid, loadShader(GL_VERTEX_SHADER, "solid_vs", solid_vs_txt, sizeof(solid_vs_txt)));
	glAttachShader(msolid, loadShader(GL_FRAGMENT_SHADER, "solid_fs", solid_fs_txt, sizeof(solid_fs_txt)));
	glAttachShader(msolid, loadShader(GL_GEOMETRY_SHADER, "solid_gs", solid_gs_txt, sizeof(solid_gs_txt)));
	glLinkProgram(msolid);
	solid_VIEW = glGetUniformLocation(msolid, "VIEW");
	solid_COLOR = glGetUniformLocation(msolid, "COLOR");
	solid_SCREENSIZE = glGetUniformLocation(msolid, "SCREENSIZE");
	solid_DATA = glGetAttribLocation(msolid, "DATA");
}

void setup_gl(void) {
	glGetIntegerv(GL_CURRENT_PROGRAM, &origprog);
	useFasterShaders = 1;
	char *shVer = (void *)glGetString(GL_SHADING_LANGUAGE_VERSION);
	if(!shVer) shVer = "<unknown>";
	float minVer = 4.10;
	float version = 0.0;
	sscanf(shVer, "%f", &version);
	useFasterShaders = (version >= minVer);

	if(useFasterShaders) {
		init_shader_stuff();
	} else {
		mylog("GLSL version '%s' too old, using fallback slow spanner\n", shVer);
		mylog("   (Minimum version we want is %.2f)\n", minVer);
	}
	newspanner = useFasterShaders ? 1 : 0;
}
