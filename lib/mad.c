#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <unistd.h>
#include <fcntl.h>

#include <mad.h>
#include "misc.h"

struct audioRec *loadMP3(char *filename) {
	struct mad_stream mad_stream;
	struct mad_frame mad_frame;
	struct mad_synth mad_synth;

	mad_stream_init(&mad_stream);
	mad_synth_init(&mad_synth);
	mad_frame_init(&mad_frame);

	int fd = open(filename, O_RDONLY);
	if(fd<0) {
		printf("loadMP3:Can't open file %s\n", filename);
		return 0;
	}
	off_t filelen = lseek(fd, 0l, SEEK_END);
	lseek(fd, 0l, SEEK_SET);

	unsigned char *input_stream = mmap(0, filelen, PROT_READ, MAP_SHARED, fd, 0);

	// Copy pointer and length to mad_stream struct
	mad_stream_buffer(&mad_stream, input_stream, filelen);

	int count = 0;
	mad_fixed_t *pointer=0;
	int channels=0;
	int sampleCount=0;
	int sampleRate=0;
	int bufferSize = 0x100000;
	int space;
	void computeSpace() {
		space = bufferSize / (sizeof(mad_fixed_t)*channels);
	}

	int i, j;
	for(;;) {
		// Decode frame from the stream
		if (mad_frame_decode(&mad_frame, &mad_stream)) {
			if(mad_stream.error == MAD_ERROR_BUFLEN) break; // EOF
			if (MAD_RECOVERABLE(mad_stream.error)) {
				continue;
			} else if (mad_stream.error == MAD_ERROR_BUFLEN) {
				continue;
			} else {
				break;
			}
		}
		// Synthesize PCM data of frame
		mad_synth_frame(&mad_synth, &mad_frame);
		struct mad_pcm *pcm = &mad_synth.pcm;
		if(count==0) {
			channels = pcm->channels;
			sampleRate = pcm->samplerate;
			pointer = malloc(bufferSize);
			computeSpace();
		}
		int n = pcm->length;
		if(channels*(sampleCount+n) > space) {
			bufferSize<<=1;
			computeSpace();
			pointer = realloc(pointer, bufferSize);
		}
		int off = sampleCount*channels;
		for(i=0;i<n;++i) {
			for(j=0;j<channels;++j)
				pointer[off++] = pcm->samples[j][i];
		}
		sampleCount+=n;
		++count;
	}

	munmap(input_stream, filelen);
	close(fd);

	mad_synth_finish(&mad_synth);
	mad_frame_finish(&mad_frame);
	mad_stream_finish(&mad_stream);

	struct audioRec *ar;
	ar = malloc(sizeof(*ar) + channels*sampleCount*sizeof(double));
	j = sampleCount*channels;
	for(i=0;i<j;++i)
		ar->samples[i] = pointer[i]/(double)MAD_F_ONE;
	free(pointer);
	ar->sampleCount = sampleCount;
	ar->channelCount = channels;
	ar->sampleRate = sampleRate;
	return ar;
}
