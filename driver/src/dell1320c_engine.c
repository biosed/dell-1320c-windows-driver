/**
 * dell1320c_engine.c - Unified HBPL v2 Protocol Engine for Dell 1320c
 * Ported from biosed/dell-1320c-cups-driver for Windows (x86, x64, ARM64) and POSIX.
 */

#include "dell1320c_engine.h"
#include "sq21_simple.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>

#ifdef _WIN32
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #include <windows.h>
  #define strcasecmp _stricmp
#else
  #include <unistd.h>
  #include <netdb.h>
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <arpa/inet.h>
  #include <fcntl.h>
#endif

#define UEL "\033%-12345X"

/* Helper to write 32-bit little-endian integer */
static void write_le32(unsigned char *buf, uint32_t val) {
    buf[0] = (unsigned char)(val & 0xFF);
    buf[1] = (unsigned char)((val >> 8) & 0xFF);
    buf[2] = (unsigned char)((val >> 16) & 0xFF);
    buf[3] = (unsigned char)((val >> 24) & 0xFF);
}

void dell1320c_default_config(DellJobConfig *cfg) {
    if (!cfg) return;
    memset(cfg, 0, sizeof(*cfg));
    strncpy(cfg->user, "WindowsUser", sizeof(cfg->user) - 1);
    strncpy(cfg->title, "Print Job", sizeof(cfg->title) - 1);
    cfg->copies = 1;
    cfg->dpi = 600;
    cfg->color_mode = DELL1320C_MODE_COLOR;
    cfg->tray = DELL1320C_TRAY_1;
    cfg->paper = DELL1320C_PAPER_LETTER;
    cfg->width_pt = 612;
    cfg->height_pt = 792;
}

DellPaperCode dell1320c_paper_code(uint32_t width_pt, uint32_t height_pt) {
    /* Letter: 612 x 792 */
    if ((width_pt >= 610 && width_pt <= 614 && height_pt >= 790 && height_pt <= 794) ||
        (width_pt == 600 && height_pt == 842)) {
        return DELL1320C_PAPER_LETTER;
    }
    /* A4: 595 x 842 */
    if (width_pt >= 593 && width_pt <= 597 && height_pt >= 840 && height_pt <= 844) {
        return DELL1320C_PAPER_A4;
    }
    /* Legal: 612 x 1008 */
    if (width_pt >= 610 && width_pt <= 614 && height_pt >= 1006 && height_pt <= 1010) {
        return DELL1320C_PAPER_LEGAL;
    }
    /* Executive: 522 x 756 */
    if (width_pt >= 520 && width_pt <= 524 && height_pt >= 754 && height_pt <= 758) {
        return DELL1320C_PAPER_EXECUTIVE;
    }
    /* B5: 516 x 729 */
    if (width_pt >= 514 && width_pt <= 518 && height_pt >= 727 && height_pt <= 731) {
        return DELL1320C_PAPER_B5;
    }
    /* Folio: 612 x 936 */
    if (width_pt >= 610 && width_pt <= 614 && height_pt >= 934 && height_pt <= 938) {
        return DELL1320C_PAPER_FOLIO;
    }
    /* Env #10: 297 x 684 */
    if (width_pt >= 295 && width_pt <= 299 && height_pt >= 682 && height_pt <= 686) {
        return DELL1320C_PAPER_ENV_10;
    }
    /* Monarch: 279 x 540 */
    if (width_pt >= 277 && width_pt <= 281 && height_pt >= 538 && height_pt <= 542) {
        return DELL1320C_PAPER_MONARCH;
    }
    /* DL: 312 x 624 */
    if (width_pt >= 310 && width_pt <= 314 && height_pt >= 622 && height_pt <= 626) {
        return DELL1320C_PAPER_DL;
    }
    /* C5: 459 x 649 */
    if (width_pt >= 457 && width_pt <= 461 && height_pt >= 647 && height_pt <= 651) {
        return DELL1320C_PAPER_C5;
    }
    return DELL1320C_PAPER_LETTER;
}

int dell1320c_parse_paper(const char *name, DellPaperCode *code, int *w_pt, int *h_pt) {
    if (!name) return -1;
    if (strcasecmp(name, "Letter") == 0) {
        if (code) *code = DELL1320C_PAPER_LETTER;
        if (w_pt) *w_pt = 612;
        if (h_pt) *h_pt = 792;
        return 0;
    }
    if (strcasecmp(name, "A4") == 0) {
        if (code) *code = DELL1320C_PAPER_A4;
        if (w_pt) *w_pt = 595;
        if (h_pt) *h_pt = 842;
        return 0;
    }
    if (strcasecmp(name, "Legal") == 0) {
        if (code) *code = DELL1320C_PAPER_LEGAL;
        if (w_pt) *w_pt = 612;
        if (h_pt) *h_pt = 1008;
        return 0;
    }
    if (strcasecmp(name, "Executive") == 0) {
        if (code) *code = DELL1320C_PAPER_EXECUTIVE;
        if (w_pt) *w_pt = 522;
        if (h_pt) *h_pt = 756;
        return 0;
    }
    if (strcasecmp(name, "B5") == 0) {
        if (code) *code = DELL1320C_PAPER_B5;
        if (w_pt) *w_pt = 516;
        if (h_pt) *h_pt = 729;
        return 0;
    }
    if (strcasecmp(name, "Folio") == 0) {
        if (code) *code = DELL1320C_PAPER_FOLIO;
        if (w_pt) *w_pt = 612;
        if (h_pt) *h_pt = 936;
        return 0;
    }
    if (strcasecmp(name, "Env10") == 0 || strcasecmp(name, "COM10") == 0) {
        if (code) *code = DELL1320C_PAPER_ENV_10;
        if (w_pt) *w_pt = 297;
        if (h_pt) *h_pt = 684;
        return 0;
    }
    if (strcasecmp(name, "Monarch") == 0) {
        if (code) *code = DELL1320C_PAPER_MONARCH;
        if (w_pt) *w_pt = 279;
        if (h_pt) *h_pt = 540;
        return 0;
    }
    if (strcasecmp(name, "DL") == 0) {
        if (code) *code = DELL1320C_PAPER_DL;
        if (w_pt) *w_pt = 312;
        if (h_pt) *h_pt = 624;
        return 0;
    }
    if (strcasecmp(name, "C5") == 0) {
        if (code) *code = DELL1320C_PAPER_C5;
        if (w_pt) *w_pt = 459;
        if (h_pt) *h_pt = 649;
        return 0;
    }
    return -1;
}

void dell1320c_write_job_header(FILE *out, const DellJobConfig *cfg) {
    time_t now = time(NULL);
    struct tm *tm = localtime(&now);
    char hostname[128];

    #ifdef _WIN32
        DWORD sz = sizeof(hostname);
        if (!GetComputerNameA(hostname, &sz)) {
            strcpy(hostname, "WINDOWS-PC");
        }
    #else
        if (gethostname(hostname, sizeof(hostname)) != 0) {
            strcpy(hostname, "localhost");
        }
    #endif

    fprintf(out, "%s", UEL);
    fprintf(out, "@PJL COMMENT DATE=%02d/%02d/%04d\n",
            tm ? tm->tm_mon + 1 : 1,
            tm ? tm->tm_mday : 1,
            tm ? tm->tm_year + 1900 : 2026);
    fprintf(out, "@PJL COMMENT TIME=%02d:%02d:%02d\n",
            tm ? tm->tm_hour : 12,
            tm ? tm->tm_min : 0,
            tm ? tm->tm_sec : 0);
    fprintf(out, "@PJL COMMENT DNAME=%s\n", cfg->title[0] ? cfg->title : "Print Job");
    fprintf(out, "@PJL JOB MODE=PRINTER\n");
    fprintf(out, "@PJL SET JOBATTR=\"@LUNA=%s\"\n", cfg->user[0] ? cfg->user : "WindowsUser");
    fprintf(out, "@PJL SET JOBATTR=\"@JOAU=%s\"\n", cfg->user[0] ? cfg->user : "WindowsUser");
    fprintf(out, "@PJL SET JOBATTR=\"@CNAM=%s\"\n", hostname);
    fprintf(out, "@PJL SET JOBATTR=\"@HOAD=7F000001\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@NLPP=1\"\n");
    fprintf(out, "@PJL SET COPIES=%d\n", cfg->copies > 0 ? cfg->copies : 1);
    fprintf(out, "@PJL SET RENDERMODE=%s\n", cfg->color_mode == DELL1320C_MODE_COLOR ? "COLOR" : "BLACK");
    fprintf(out, "@PJL SET DUPLEX=OFF\n");
    fprintf(out, "@PJL SET OUTBIN=FACEDOWN\n");
    fprintf(out, "@PJL SET PAPERDIRECTION=SEF\n");
    fprintf(out, "@PJL SET JOBATTR=\"@MSIP=NORMAL\"\n");
    fprintf(out, "@PJL SET RESOLUTION=%d\n", (cfg->dpi == 300) ? 300 : 600);
    fprintf(out, "@PJL SET BITSPERPIXEL=8\n");
    fprintf(out, "@PJL SET JOBATTR=\"@TRCH=ON\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@APSP=OFF\"\n");
    fprintf(out, "@PJL SET ECONOMODE=OFF\n");
    fprintf(out, "@PJL SET SLIPSHEET=OFF\n");
    fprintf(out, "@PJL SET JOBATTR=\"@SPSE=AUTO\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@PODR=NORMAL\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@DRDM=RASTER\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@BANR=DEVICE\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@IREC=OFF\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@TCPR=24\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@GCPR=24\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@ICPR=24\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@TUCR=24\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@GUCR=24\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@IUCR=24\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@TTRC=9\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@GTRC=9\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@ITRC=9\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@TSCR=9\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@GSCR=9\"\n");
    fprintf(out, "@PJL SET JOBATTR=\"@ISCR=9\"\n");
    fprintf(out, "@PJL ENTER LANGUAGE=HBPL\n");

    /* Document begin token sequence: 41 81 a1 00 82 a2 01 00 83 a2 01 00 */
    static const unsigned char doc_begin[] = {
        0x41, 0x81, 0xa1, 0x00,
        0x82, 0xa2, 0x01, 0x00,
        0x83, 0xa2, 0x01, 0x00
    };
    fwrite(doc_begin, 1, sizeof(doc_begin), out);
}

void dell1320c_write_job_trailer(FILE *out) {
    /* Document end: "B" + UEL + "@PJL EOJ\n\033%-12345X" */
    fprintf(out, "B%s@PJL EOJ\n%s", UEL, UEL);
    fflush(out);
}

int dell1320c_write_page_rgb(FILE *out, const uint8_t *rgb_data, int width_px, int height_px,
                            const DellJobConfig *cfg, int page_num) {
    uint8_t *compressed = NULL;
    size_t compressed_size = 0;
    int dpi = (cfg && cfg->dpi == 300) ? 300 : 600;
    int ret;

    /* Compress raster with SQ21 */
    ret = sq21_compress_888(rgb_data, width_px, height_px, dpi, &compressed, &compressed_size);
    if (ret != 0 || !compressed) {
        fprintf(stderr, "ERROR: sq21_compress_888 failed (code %d)\n", ret);
        return -1;
    }

    /* Map paper code */
    uint32_t w_pt = cfg ? cfg->width_pt : 612;
    uint32_t h_pt = cfg ? cfg->height_pt : 792;
    int pc = (cfg && cfg->paper != DELL1320C_PAPER_CUSTOM) ? cfg->paper : dell1320c_paper_code(w_pt, h_pt);
    int slot = cfg ? cfg->tray : DELL1320C_TRAY_1;

    /* Build 78-byte Page Header */
    unsigned char ph[78];
    int off = 0;

    ph[off++] = 0x43;                           /* page begin */
    ph[off++] = 0x91; ph[off++] = 0xa1;
    ph[off++] = (unsigned char)pc;              /* paper code */
    ph[off++] = 0x92; ph[off++] = 0xa1;
    ph[off++] = 0x02;                           /* vendor page attribute */
    ph[off++] = 0x93; ph[off++] = 0xa1;
    ph[off++] = 0x01;                           /* unknown */
    ph[off++] = 0x94; ph[off++] = 0xa1;
    ph[off++] = 0x00;                           /* color mode */
    ph[off++] = 0x95; ph[off++] = 0xc2;
    ph[off++] = 0x00; ph[off++] = 0x00;
    ph[off++] = 0x00; ph[off++] = 0x00;        /* paper dims zeros */
    ph[off++] = 0x96; ph[off++] = 0xa1;
    ph[off++] = (unsigned char)slot;            /* input slot */
    ph[off++] = 0x97; ph[off++] = 0xc3;
    if (dpi == 300) {
        ph[off++] = 0x2f; ph[off++] = 0x00;     /* 300dpi = 0x002f */
        ph[off++] = 0x2f; ph[off++] = 0x00;
    } else {
        ph[off++] = 0x5e; ph[off++] = 0x00;     /* 600dpi = 0x005e */
        ph[off++] = 0x5e; ph[off++] = 0x00;
    }
    ph[off++] = 0x98; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0x99; ph[off++] = 0xa4;
    write_le32(&ph[off], (uint32_t)page_num); off += 4; /* page number */
    ph[off++] = 0x9a; ph[off++] = 0xc4;
    write_le32(&ph[off], w_pt); off += 4;       /* width */
    write_le32(&ph[off], h_pt); off += 4;       /* height */
    ph[off++] = 0x9b; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0x9c; ph[off++] = 0xa1;
    ph[off++] = 0x01;
    ph[off++] = 0x9d; ph[off++] = 0xa1;
    ph[off++] = 0x16;                           /* SQ21 compression (0x16) */
    ph[off++] = 0x9e; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0x9f; ph[off++] = 0xa1;
    ph[off++] = 0x01;
    ph[off++] = 0xa0; ph[off++] = 0xa1;
    ph[off++] = 0x20;                           /* bits = 0x20 */
    ph[off++] = 0xa1; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0xa2; ph[off++] = 0xc4;
    write_le32(&ph[off], w_pt); off += 4;       /* width again */
    write_le32(&ph[off], h_pt); off += 4;       /* height again */

    fwrite(ph, 1, (size_t)off, out);

    /* Band marker (12 bytes) */
    unsigned char bm[12];
    uint32_t band_blob_size = (uint32_t)(24 + compressed_size);
    bm[0] = 0x51; bm[1] = 0x52; bm[2] = 0xa3; bm[3] = 0xa1;
    bm[4] = 0x00; bm[5] = 0xa4; bm[6] = 0xb1; bm[7] = 0xa4;
    write_le32(&bm[8], band_blob_size);
    fwrite(bm, 1, 12, out);

    /* Band header (24 bytes) */
    static const unsigned char band_hdr[24] = {
        0x18, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x10, 0x32, 0x04, 0x00,
        0xa1, 0x42, 0x00, 0x00,
        0x00, 0x00, 0xff, 0x00,
        0x00, 0x00, 0x00, 0x00
    };
    fwrite(band_hdr, 1, 24, out);

    /* Write compressed data */
    fwrite(compressed, 1, compressed_size, out);

    /* Page end marker */
    fwrite("SD", 1, 2, out);

    free(compressed);
    return 0;
}

int dell1320c_write_page_mono(FILE *out, const uint8_t *mono_data, int line_size, int height_px,
                             const DellJobConfig *cfg, int page_num) {
    uint8_t *compressed = NULL;
    size_t compressed_size = 0;
    int dpi = (cfg && cfg->dpi == 300) ? 300 : 600;
    int ret;

    ret = sq21_compress_8(mono_data, line_size, height_px, dpi, &compressed, &compressed_size);
    if (ret != 0 || !compressed) {
        fprintf(stderr, "ERROR: sq21_compress_8 failed (code %d)\n", ret);
        return -1;
    }

    uint32_t w_pt = cfg ? cfg->width_pt : 612;
    uint32_t h_pt = cfg ? cfg->height_pt : 792;
    int pc = (cfg && cfg->paper != DELL1320C_PAPER_CUSTOM) ? cfg->paper : dell1320c_paper_code(w_pt, h_pt);
    int slot = cfg ? cfg->tray : DELL1320C_TRAY_1;

    unsigned char ph[78];
    int off = 0;

    ph[off++] = 0x43;
    ph[off++] = 0x91; ph[off++] = 0xa1;
    ph[off++] = (unsigned char)pc;
    ph[off++] = 0x92; ph[off++] = 0xa1;
    ph[off++] = 0x02;
    ph[off++] = 0x93; ph[off++] = 0xa1;
    ph[off++] = 0x01;
    ph[off++] = 0x94; ph[off++] = 0xa1;
    ph[off++] = 0x00;                           /* monochrome */
    ph[off++] = 0x95; ph[off++] = 0xc2;
    ph[off++] = 0x00; ph[off++] = 0x00;
    ph[off++] = 0x00; ph[off++] = 0x00;
    ph[off++] = 0x96; ph[off++] = 0xa1;
    ph[off++] = (unsigned char)slot;
    ph[off++] = 0x97; ph[off++] = 0xc3;
    if (dpi == 300) {
        ph[off++] = 0x2f; ph[off++] = 0x00;
        ph[off++] = 0x2f; ph[off++] = 0x00;
    } else {
        ph[off++] = 0x5e; ph[off++] = 0x00;
        ph[off++] = 0x5e; ph[off++] = 0x00;
    }
    ph[off++] = 0x98; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0x99; ph[off++] = 0xa4;
    write_le32(&ph[off], (uint32_t)page_num); off += 4;
    ph[off++] = 0x9a; ph[off++] = 0xc4;
    write_le32(&ph[off], w_pt); off += 4;
    write_le32(&ph[off], h_pt); off += 4;
    ph[off++] = 0x9b; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0x9c; ph[off++] = 0xa1;
    ph[off++] = 0x01;
    ph[off++] = 0x9d; ph[off++] = 0xa1;
    ph[off++] = 0x16;
    ph[off++] = 0x9e; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0x9f; ph[off++] = 0xa1;
    ph[off++] = 0x01;
    ph[off++] = 0xa0; ph[off++] = 0xa1;
    ph[off++] = 0x08;                           /* bits = 0x08 for mono */
    ph[off++] = 0xa1; ph[off++] = 0xa1;
    ph[off++] = 0x00;
    ph[off++] = 0xa2; ph[off++] = 0xc4;
    write_le32(&ph[off], w_pt); off += 4;
    write_le32(&ph[off], h_pt); off += 4;

    fwrite(ph, 1, (size_t)off, out);

    unsigned char bm[12];
    uint32_t band_blob_size = (uint32_t)(24 + compressed_size);
    bm[0] = 0x51; bm[1] = 0x52; bm[2] = 0xa3; bm[3] = 0xa1;
    bm[4] = 0x00; bm[5] = 0xa4; bm[6] = 0xb1; bm[7] = 0xa4;
    write_le32(&bm[8], band_blob_size);
    fwrite(bm, 1, 12, out);

    static const unsigned char band_hdr[24] = {
        0x18, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x00,
        0x10, 0x32, 0x04, 0x00,
        0xa1, 0x42, 0x00, 0x00,
        0x00, 0x00, 0xff, 0x00,
        0x00, 0x00, 0x00, 0x00
    };
    fwrite(band_hdr, 1, 24, out);

    fwrite(compressed, 1, compressed_size, out);
    fwrite("SD", 1, 2, out);

    free(compressed);
    return 0;
}

/* PPM (P6 / P5) parser helper */
static int read_ppm_token(FILE *in, char *buf, size_t buf_len) {
    size_t i = 0;
    int c;
    while ((c = fgetc(in)) != EOF) {
        if (c == '#') {
            while ((c = fgetc(in)) != EOF && c != '\n');
            continue;
        }
        if (!isspace(c)) break;
    }
    if (c == EOF) return -1;
    buf[i++] = (char)c;
    while (i < buf_len - 1 && (c = fgetc(in)) != EOF && !isspace(c)) {
        buf[i++] = (char)c;
    }
    buf[i] = '\0';
    return 0;
}

int dell1320c_process_ppm(FILE *in, FILE *out, const DellJobConfig *cfg) {
    char magic[16], token[64];
    int page = 0;

    dell1320c_write_job_header(out, cfg);

    while (read_ppm_token(in, magic, sizeof(magic)) == 0) {
        int is_rgb = (strcmp(magic, "P6") == 0);
        int is_mono = (strcmp(magic, "P5") == 0);
        if (!is_rgb && !is_mono) {
            fprintf(stderr, "Unknown PPM magic: %s\n", magic);
            break;
        }

        if (read_ppm_token(in, token, sizeof(token)) != 0) break;
        int w = atoi(token);
        if (read_ppm_token(in, token, sizeof(token)) != 0) break;
        int h = atoi(token);
        if (read_ppm_token(in, token, sizeof(token)) != 0) break;
        int maxval = atoi(token);
        (void)maxval;

        page++;
        size_t bpp = is_rgb ? 3 : 1;
        size_t raster_size = (size_t)w * (size_t)h * bpp;
        uint8_t *raster = (uint8_t*)malloc(raster_size);
        if (!raster) {
            fprintf(stderr, "Out of memory allocating %zu bytes\n", raster_size);
            break;
        }

        if (fread(raster, 1, raster_size, in) != raster_size) {
            fprintf(stderr, "Short read on PPM raster page %d\n", page);
            free(raster);
            break;
        }

        DellJobConfig page_cfg = *cfg;
        /* Derive points if not configured */
        int dpi = (cfg->dpi == 300) ? 300 : 600;
        if (page_cfg.width_pt <= 0 || page_cfg.height_pt <= 0) {
            page_cfg.width_pt = (w * 72) / dpi;
            page_cfg.height_pt = (h * 72) / dpi;
        }

        if (is_rgb && cfg->color_mode == DELL1320C_MODE_COLOR) {
            dell1320c_write_page_rgb(out, raster, w, h, &page_cfg, page);
        } else if (is_rgb && cfg->color_mode == DELL1320C_MODE_MONO) {
            /* Convert RGB to 8-bit Grayscale */
            uint8_t *mono = (uint8_t*)malloc((size_t)w * h);
            if (mono) {
                for (size_t p = 0; p < (size_t)w * h; p++) {
                    uint32_t r = raster[p*3 + 0];
                    uint32_t g = raster[p*3 + 1];
                    uint32_t b = raster[p*3 + 2];
                    mono[p] = (uint8_t)((r * 77 + g * 150 + b * 29) >> 8);
                }
                dell1320c_write_page_mono(out, mono, w, h, &page_cfg, page);
                free(mono);
            }
        } else {
            dell1320c_write_page_mono(out, raster, w, h, &page_cfg, page);
        }

        free(raster);
    }

    dell1320c_write_job_trailer(out);
    return 0;
}

#pragma pack(push, 1)
typedef struct {
    uint16_t bfType;
    uint32_t bfSize;
    uint16_t bfReserved1;
    uint16_t bfReserved2;
    uint32_t bfOffBits;
} WinBMPFileHeader;

typedef struct {
    uint32_t biSize;
    int32_t  biWidth;
    int32_t  biHeight;
    uint16_t biPlanes;
    uint16_t biBitCount;
    uint32_t biCompression;
    uint32_t biSizeImage;
    int32_t  biXPelsPerMeter;
    int32_t  biYPelsPerMeter;
    uint32_t biClrUsed;
    uint32_t biClrImportant;
} WinBMPInfoHeader;
#pragma pack(pop)

int dell1320c_process_bmp(FILE *in, FILE *out, const DellJobConfig *cfg) {
    WinBMPFileHeader bfh;
    WinBMPInfoHeader bih;

    if (fread(&bfh, sizeof(bfh), 1, in) != 1) return -1;
    if (bfh.bfType != 0x4D42) { /* "BM" */
        fprintf(stderr, "Not a valid Windows BMP file.\n");
        return -1;
    }
    if (fread(&bih, sizeof(bih), 1, in) != 1) return -1;

    int w = bih.biWidth;
    int h = bih.biHeight > 0 ? bih.biHeight : -bih.biHeight;
    int bottom_up = (bih.biHeight > 0);

    if (bih.biBitCount != 24 && bih.biBitCount != 32) {
        fprintf(stderr, "Only 24-bit and 32-bit BMP currently supported (got %d bpp)\n", bih.biBitCount);
        return -1;
    }

    fseek(in, (long)bfh.bfOffBits, SEEK_SET);

    size_t row_stride = ((size_t)w * (bih.biBitCount / 8) + 3) & ~3u;
    uint8_t *row_buf = (uint8_t*)malloc(row_stride);
    uint8_t *rgb_raster = (uint8_t*)malloc((size_t)w * h * 3);
    if (!row_buf || !rgb_raster) {
        free(row_buf); free(rgb_raster);
        return -1;
    }

    int bytes_per_pixel = bih.biBitCount / 8;
    for (int y = 0; y < h; y++) {
        if (fread(row_buf, 1, row_stride, in) != row_stride) break;
        int target_y = bottom_up ? (h - 1 - y) : y;
        uint8_t *dst_row = rgb_raster + (size_t)target_y * w * 3;

        for (int x = 0; x < w; x++) {
            /* Windows BMP stores in BGR order */
            uint8_t b = row_buf[x * bytes_per_pixel + 0];
            uint8_t g = row_buf[x * bytes_per_pixel + 1];
            uint8_t r = row_buf[x * bytes_per_pixel + 2];
            dst_row[x * 3 + 0] = r;
            dst_row[x * 3 + 1] = g;
            dst_row[x * 3 + 2] = b;
        }
    }
    free(row_buf);

    dell1320c_write_job_header(out, cfg);

    DellJobConfig page_cfg = *cfg;
    int dpi = (cfg->dpi == 300) ? 300 : 600;
    if (page_cfg.width_pt <= 0 || page_cfg.height_pt <= 0) {
        page_cfg.width_pt = (w * 72) / dpi;
        page_cfg.height_pt = (h * 72) / dpi;
    }

    if (cfg->color_mode == DELL1320C_MODE_COLOR) {
        dell1320c_write_page_rgb(out, rgb_raster, w, h, &page_cfg, 1);
    } else {
        uint8_t *mono = (uint8_t*)malloc((size_t)w * h);
        if (mono) {
            for (size_t p = 0; p < (size_t)w * h; p++) {
                uint32_t r = rgb_raster[p*3 + 0];
                uint32_t g = rgb_raster[p*3 + 1];
                uint32_t b = rgb_raster[p*3 + 2];
                mono[p] = (uint8_t)((r * 77 + g * 150 + b * 29) >> 8);
            }
            dell1320c_write_page_mono(out, mono, w, h, &page_cfg, 1);
            free(mono);
        }
    }

    dell1320c_write_job_trailer(out);
    free(rgb_raster);
    return 0;
}

int dell1320c_send_network(const char *hostname_or_ip, int port, const uint8_t *data, size_t size) {
    if (!hostname_or_ip || !data || size == 0) return -1;
    if (port <= 0) port = 9100; /* Standard Raw Print Port */

    #ifdef _WIN32
        WSADATA wsa;
        if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) return -1;
    #endif

    struct addrinfo hints, *res = NULL, *rp = NULL;
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    char port_str[16];
    snprintf(port_str, sizeof(port_str), "%d", port);

    if (getaddrinfo(hostname_or_ip, port_str, &hints, &res) != 0) {
        #ifdef _WIN32
            WSACleanup();
        #endif
        return -1;
    }

    int s = -1;
    for (rp = res; rp != NULL; rp = rp->ai_next) {
        s = (int)socket(rp->ai_family, rp->ai_socktype, rp->ai_protocol);
        if (s < 0) continue;
        if (connect(s, rp->ai_addr, (int)rp->ai_addrlen) == 0) break;
        #ifdef _WIN32
            closesocket(s);
        #else
            close(s);
        #endif
        s = -1;
    }
    freeaddrinfo(res);

    if (s < 0) {
        #ifdef _WIN32
            WSACleanup();
        #endif
        return -2; /* Connection failed */
    }

    size_t sent = 0;
    while (sent < size) {
        int chunk = (int)((size - sent > 65536) ? 65536 : (size - sent));
        int n = send(s, (const char*)(data + sent), chunk, 0);
        if (n <= 0) {
            #ifdef _WIN32
                closesocket(s);
                WSACleanup();
            #else
                close(s);
            #endif
            return -3; /* Send failed */
        }
        sent += (size_t)n;
    }

    #ifdef _WIN32
        closesocket(s);
        WSACleanup();
    #else
        close(s);
    #endif
    return 0;
}

int dell1320c_send_usb(const char *port_or_device_name, const uint8_t *data, size_t size) {
    if (!port_or_device_name || !data || size == 0) return -1;

    #ifdef _WIN32
        HANDLE hFile = CreateFileA(
            port_or_device_name,
            GENERIC_WRITE,
            0,
            NULL,
            OPEN_EXISTING,
            FILE_ATTRIBUTE_NORMAL,
            NULL
        );
        if (hFile == INVALID_HANDLE_VALUE) {
            return -1;
        }

        DWORD written = 0;
        size_t total = 0;
        while (total < size) {
            DWORD chunk = (DWORD)((size - total > 65536) ? 65536 : (size - total));
            if (!WriteFile(hFile, data + total, chunk, &written, NULL) || written == 0) {
                CloseHandle(hFile);
                return -2;
            }
            total += written;
        }
        CloseHandle(hFile);
        return 0;
    #else
        int fd = open(port_or_device_name, O_WRONLY);
        if (fd < 0) return -1;
        size_t total = 0;
        while (total < size) {
            ssize_t n = write(fd, data + total, size - total);
            if (n <= 0) { close(fd); return -2; }
            total += (size_t)n;
        }
        close(fd);
        return 0;
    #endif
}

uint8_t *dell1320c_generate_test_pattern(int width, int height, size_t *out_size) {
    size_t sz = (size_t)width * height * 3;
    uint8_t *img = (uint8_t*)malloc(sz);
    if (!img) return NULL;

    /* Fill background with clean off-white */
    memset(img, 0xF8, sz);

    /* Draw test color bars (Cyan, Magenta, Yellow, Black, Red, Green, Blue) */
    int bar_y_start = height / 5;
    int bar_height = height / 10;
    int bar_width = width / 8;

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            size_t idx = (size_t)(y * width + x) * 3;

            /* Outer margin border */
            if (x < 30 || x > width - 30 || y < 30 || y > height - 30) {
                img[idx + 0] = 0x20;
                img[idx + 1] = 0x20;
                img[idx + 2] = 0x20;
                continue;
            }

            /* Alignment crosshairs */
            if ((x >= width/2 - 2 && x <= width/2 + 2 && y > 40 && y < 100) ||
                (y >= 70 - 2 && y <= 70 + 2 && x > width/2 - 30 && x < width/2 + 30)) {
                img[idx + 0] = 0; img[idx + 1] = 0; img[idx + 2] = 0;
                continue;
            }

            /* 8 Calibration Color Bars */
            if (y >= bar_y_start && y < bar_y_start + bar_height) {
                int col_idx = (x - 60) / bar_width;
                if (col_idx >= 0 && col_idx < 7 && x >= 60 && x < 60 + bar_width * 7) {
                    switch (col_idx) {
                        case 0: /* Cyan */
                            img[idx+0] = 0; img[idx+1] = 220; img[idx+2] = 230; break;
                        case 1: /* Magenta */
                            img[idx+0] = 230; img[idx+1] = 20; img[idx+2] = 160; break;
                        case 2: /* Yellow */
                            img[idx+0] = 250; img[idx+1] = 220; img[idx+2] = 20; break;
                        case 3: /* Black */
                            img[idx+0] = 20; img[idx+1] = 20; img[idx+2] = 20; break;
                        case 4: /* Red */
                            img[idx+0] = 230; img[idx+1] = 30; img[idx+2] = 30; break;
                        case 5: /* Green */
                            img[idx+0] = 30; img[idx+1] = 190; img[idx+2] = 60; break;
                        case 6: /* Blue */
                            img[idx+0] = 30; img[idx+1] = 60; img[idx+2] = 230; break;
                    }
                }
            }

            /* Grayscale gradient ramp */
            int ramp_y = bar_y_start + bar_height + 40;
            int ramp_h = 60;
            if (y >= ramp_y && y < ramp_y + ramp_h && x >= 60 && x < width - 60) {
                uint8_t gray = (uint8_t)(((x - 60) * 255) / (width - 120));
                img[idx + 0] = gray;
                img[idx + 1] = gray;
                img[idx + 2] = gray;
            }
        }
    }

    if (out_size) *out_size = sz;
    return img;
}
