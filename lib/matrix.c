#include "misc.h"

int inv_mat4(GLfloat invOut[16], const GLfloat m[16])
{
	GLfloat inv[16], det;
	int i;

	inv[0] = m[5]  * m[10] * m[15] - 
			 m[5]  * m[11] * m[14] - 
			 m[9]  * m[6]  * m[15] + 
			 m[9]  * m[7]  * m[14] +
			 m[13] * m[6]  * m[11] - 
			 m[13] * m[7]  * m[10];

	inv[4] = -m[4]  * m[10] * m[15] + 
			  m[4]  * m[11] * m[14] + 
			  m[8]  * m[6]  * m[15] - 
			  m[8]  * m[7]  * m[14] - 
			  m[12] * m[6]  * m[11] + 
			  m[12] * m[7]  * m[10];

	inv[8] = m[4]  * m[9] * m[15] - 
			 m[4]  * m[11] * m[13] - 
			 m[8]  * m[5] * m[15] + 
			 m[8]  * m[7] * m[13] + 
			 m[12] * m[5] * m[11] - 
			 m[12] * m[7] * m[9];

	inv[12] = -m[4]  * m[9] * m[14] + 
			   m[4]  * m[10] * m[13] +
			   m[8]  * m[5] * m[14] - 
			   m[8]  * m[6] * m[13] - 
			   m[12] * m[5] * m[10] + 
			   m[12] * m[6] * m[9];

	inv[1] = -m[1]  * m[10] * m[15] + 
			  m[1]  * m[11] * m[14] + 
			  m[9]  * m[2] * m[15] - 
			  m[9]  * m[3] * m[14] - 
			  m[13] * m[2] * m[11] + 
			  m[13] * m[3] * m[10];

	inv[5] = m[0]  * m[10] * m[15] - 
			 m[0]  * m[11] * m[14] - 
			 m[8]  * m[2] * m[15] + 
			 m[8]  * m[3] * m[14] + 
			 m[12] * m[2] * m[11] - 
			 m[12] * m[3] * m[10];

	inv[9] = -m[0]  * m[9] * m[15] + 
			  m[0]  * m[11] * m[13] + 
			  m[8]  * m[1] * m[15] - 
			  m[8]  * m[3] * m[13] - 
			  m[12] * m[1] * m[11] + 
			  m[12] * m[3] * m[9];

	inv[13] = m[0]  * m[9] * m[14] - 
			  m[0]  * m[10] * m[13] - 
			  m[8]  * m[1] * m[14] + 
			  m[8]  * m[2] * m[13] + 
			  m[12] * m[1] * m[10] - 
			  m[12] * m[2] * m[9];

	inv[2] = m[1]  * m[6] * m[15] - 
			 m[1]  * m[7] * m[14] - 
			 m[5]  * m[2] * m[15] + 
			 m[5]  * m[3] * m[14] + 
			 m[13] * m[2] * m[7] - 
			 m[13] * m[3] * m[6];

	inv[6] = -m[0]  * m[6] * m[15] + 
			  m[0]  * m[7] * m[14] + 
			  m[4]  * m[2] * m[15] - 
			  m[4]  * m[3] * m[14] - 
			  m[12] * m[2] * m[7] + 
			  m[12] * m[3] * m[6];

	inv[10] = m[0]  * m[5] * m[15] - 
			  m[0]  * m[7] * m[13] - 
			  m[4]  * m[1] * m[15] + 
			  m[4]  * m[3] * m[13] + 
			  m[12] * m[1] * m[7] - 
			  m[12] * m[3] * m[5];

	inv[14] = -m[0]  * m[5] * m[14] + 
			   m[0]  * m[6] * m[13] + 
			   m[4]  * m[1] * m[14] - 
			   m[4]  * m[2] * m[13] - 
			   m[12] * m[1] * m[6] + 
			   m[12] * m[2] * m[5];

	inv[3] = -m[1] * m[6] * m[11] + 
			  m[1] * m[7] * m[10] + 
			  m[5] * m[2] * m[11] - 
			  m[5] * m[3] * m[10] - 
			  m[9] * m[2] * m[7] + 
			  m[9] * m[3] * m[6];

	inv[7] = m[0] * m[6] * m[11] - 
			 m[0] * m[7] * m[10] - 
			 m[4] * m[2] * m[11] + 
			 m[4] * m[3] * m[10] + 
			 m[8] * m[2] * m[7] - 
			 m[8] * m[3] * m[6];

	inv[11] = -m[0] * m[5] * m[11] + 
			   m[0] * m[7] * m[9] + 
			   m[4] * m[1] * m[11] - 
			   m[4] * m[3] * m[9] - 
			   m[8] * m[1] * m[7] + 
			   m[8] * m[3] * m[5];

	inv[15] = m[0] * m[5] * m[10] - 
			  m[0] * m[6] * m[9] - 
			  m[4] * m[1] * m[10] + 
			  m[4] * m[2] * m[9] + 
			  m[8] * m[1] * m[6] - 
			  m[8] * m[2] * m[5];

	det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

	if (det == 0)
		return 0;

	det = 1.0 / det;

	for (i = 0; i < 16; i++)
		invOut[i] = inv[i] * det;

	return 1;
}

void printmat4n(char *name, GLfloat *p, int n)
{
	printf("matrix %s:\n", name);
	int i;
	for(i=0;i<n;++i)
	{
		printf("%d: %12f %12f %12f %12f\n", i, p[i+0], p[i+4], p[i+8], p[i+12]);
	}
}

void printmat4(char *name, GLfloat *p)
{
	printmat4n(name, p, 4);
}

void mat43_x_vec4(float *dest, float *m43, float *vec)
{
	float out[3];
	int i;
	for(i=0;i<3;++i)
	{
		int j = i*4;
		out[i] = m43[j+0]*vec[0] + m43[j+1]*vec[1] + m43[j+2]*vec[2] + m43[j+3]*vec[3];
	}
	vec[0] = out[0];
	vec[1] = out[1];
	vec[2] = out[2];
	vec[3] = 1.0;
}

int mat4_index(int x, int y)
{
	return y+4*x;
}

void mat4_identity(GLfloat *p)
{
	int i, j;
	for(i=0;i<4;++i)
	{
		for(j=0;j<4;++j)
		{
			p[mat4_index(i,j)] = (i==j) ? 1.0 : 0.0;
		}
	}
}

void mat4_scale(GLfloat *p, float f)
{
	int i, j;
	for(i=0;i<4;++i)
		for(j=0;j<3;++j)
			p[mat4_index(i, j)] *= f;
}

void mat4_rotation(GLfloat *p, float x, float y, float z, float a)
{
// https://en.wikipedia.org/wiki/Rotation_matrix#Axis_and_angle
	mat4_identity(p);
	a *= M_PI / 180.0;
	float c = cos(a);
	float s = sin(a);
	float C = 1.0 - c;
	p[mat4_index(0,0)] = x*x*C + c;
	p[mat4_index(0,1)] = y*x*C + z*s;
	p[mat4_index(0,2)] = z*x*C - y*s;
	p[mat4_index(1,0)] = x*y*C - z*s;
	p[mat4_index(1,1)] = y*y*C + c;
	p[mat4_index(1,2)] = z*y*C + x*s;
	p[mat4_index(2,0)] = x*z*C + y*s;
	p[mat4_index(2,1)] = y*z*C - x*s;
	p[mat4_index(2,2)] = z*z*C + c;
}

void mat4_x_mat4(GLfloat *dest, GLfloat *a, GLfloat *b)
{
	GLfloat temp[16];
	int i, j;
	for(i=0;i<4;++i)
	{
		for(j=0;j<4;++j)
		{
			double sum = 0.0;
			int k;
			for(k=0;k<4;++k)
				sum += a[mat4_index(k, j)] * b[mat4_index(i, k)];
			temp[mat4_index(i, j)] = sum;
		}
	}
	for(i=0;i<16;++i) dest[i] = temp[i];
}

void inv43(float *out, float *in)
{
	GLfloat temp[16];
	GLfloat inv[16];
	int i;
	for(i=0;i<3;++i)
	{
		int j=i*4;
		float *tp = in+j;
		temp[i+0] = tp[0];
		temp[i+4] = tp[1];
		temp[i+8] = tp[2];
		temp[i+12] = tp[3];
	}
	temp[3] = temp[7] = temp[11] = 0.0;
	temp[15] = 1.0;
	inv_mat4(inv, temp);
	for(i=0;i<16;++i)
		out[i] = inv[i];
//	static int tc = 16;
//	if(tc>0)
//	{
//		--tc;
//		printmat4("in", temp);
//		printmat4("inverse", inv);
//		mat4_x_mat4(temp, temp, inv);
//		printmat4("product *******************************", temp);
//
//	}
}

void mat4_x_vec4(GLfloat *dest, GLfloat *a, GLfloat *vec)
{
	GLfloat out[4];
	int i;
	for(i=0;i<4;++i)
	{
		int j;
		GLfloat sum = 0.0;
		for(j=0;j<4;++j)
			sum += a[mat4_index(j, i)] * vec[j];
		out[i] = sum;
	}
	memcpy(dest, out, sizeof(out));
}

void mat4_translate(GLfloat *p, float x, float y, float z)
{
	p[mat4_index(3, 0)] += x;
	p[mat4_index(3, 1)] += y;
	p[mat4_index(3, 2)] += z;
}
