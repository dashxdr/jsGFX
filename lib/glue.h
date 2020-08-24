#define TAGFLAG_LAST     64
#define TAGFLAG_TYPE      7
#define TAGTYPE_STRING    0
#define TAGTYPE_DOUBLE    1
#define TAGTYPE_INT32     2
struct tag {
	int flags;
	char name[32];
	union {
		char s[32];
		double d;
		int32_t i;
	} value;
};
int setup(int xpos, int ypos, int xsize, int ysize);
int pollInput(struct tag *tags, int max);
int pollAudio(void);
int feedAudio(short *p, int len);
void quit(int code);
void _update(void);
void _pen(double v);
void _color(unsigned char *color, int len);
void _clear(void);
void _poly(double x, double y, int s, double r, double a, double r2);
void _opoly(double x, double y, int s, double r, double a, double r2);
void _box(double x, double y, double dx, double dy, double r, double a);
void _rect(double x, double y, double dx, double dy, double r, double a);
void _test(void);
void _disc(double x, double y, double r);
void _circle(double x, double y, double r);
void _vector(double x, double y, double x2, double y2, double pen);
void _oval(double x, double y, double dx, double dy, double a);
void _ellipse(double x, double y, double dx, double dy, double a);
void _store(char *id, double x, double y, double x2, double y2);
void _restore(char *id, int validXY, double w, double h, double x, double y,
			double x1, double y1, double x2, double y2);
void _loglevel(int loglevel);
void _transform(double *mat, int len);
void _shape(void);
void glue_shape_end(void);
void glue_shape_rgb(unsigned char *color, int len);
void glue_shape_coords(double *coords, int len);

extern struct kdef {
	char *name;
	int val;
} kdefs[];
struct audioRec {
	int sampleCount;
	int channelCount;
	int sampleRate;
	double samples[0]; // all interleaved, must be last in the struct
};
struct audioRec *loadMP3(char *filename);
void loadpng(char *name, int *width, int *height, char **id);
int gCompile(char *vs, char *fs);
void gClear(double *rgba);

struct aValue { // for attributes
	char key[32];
	int value;
};
struct uValue { // for uniforms
	char key[32];
	float *array;
	int numFloats;
	float single;
	int mustFree;
};
struct gDraw {
	int program;
	int numAttributes;
	struct aValue *attributes;
	int numUniforms;
	struct uValue *uniforms;
	int numFloats;
	float *array; // vertex data
	int numIndexes;
	int16_t *indexes;
	int type;
};
void gDraw(struct gDraw *gd);
