/**
 * dell1320c_engine.h - Native Dell 1320c / Fuji Xerox DocuPrint C525A HBPL Engine
 * Ported and enhanced from biosed/dell-1320c-cups-driver for Windows x86, x64, and ARM64.
 *
 * Implements:
 *  - PJL header and job framing
 *  - SQ21 adaptive lossless compression (via sq21_simple)
 *  - HBPL v2 packet protocol (document tokens, 78-byte page header, band headers, trailer)
 *  - Multi-format raster converters (PPM, BMP, raw RGB)
 *  - Windows USB and Raw TCP/IP Port 9100 dispatch
 */

#ifndef DELL1320C_ENGINE_H
#define DELL1320C_ENGINE_H

#include <stdint.h>
#include <stddef.h>
#include <stdio.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Paper Code Definitions for Dell 1320c / HBPL v2 */
typedef enum {
    DELL1320C_PAPER_LETTER    = 0,
    DELL1320C_PAPER_LEGAL     = 1,
    DELL1320C_PAPER_FOLIO     = 2,
    DELL1320C_PAPER_A4        = 4,
    DELL1320C_PAPER_EXECUTIVE = 5,
    DELL1320C_PAPER_B5        = 8,
    DELL1320C_PAPER_ENV_10    = 9,
    DELL1320C_PAPER_MONARCH   = 11,
    DELL1320C_PAPER_DL        = 12,
    DELL1320C_PAPER_C5        = 13,
    DELL1320C_PAPER_CUSTOM    = 255
} DellPaperCode;

/* Media Tray Definitions */
typedef enum {
    DELL1320C_TRAY_AUTO    = 0,
    DELL1320C_TRAY_BYPASS  = 1,
    DELL1320C_TRAY_1       = 2, /* Standard 250-sheet tray */
    DELL1320C_TRAY_2       = 3  /* Optional 500-sheet tray */
} DellInputTray;

/* Color Modes */
typedef enum {
    DELL1320C_MODE_MONO  = 0,
    DELL1320C_MODE_COLOR = 2
} DellColorMode;

/* Job Configuration Options */
typedef struct {
    char user[64];
    char title[128];
    int copies;
    int dpi;              /* 600 or 300 */
    DellColorMode color_mode;
    DellInputTray tray;
    DellPaperCode paper;
    int width_pt;         /* width in PostScript points (e.g. 612 for Letter) */
    int height_pt;        /* height in PostScript points (e.g. 792 for Letter) */
} DellJobConfig;

/* Initialize default job configuration */
void dell1320c_default_config(DellJobConfig *cfg);

/* Map dimensions in points to HBPL paper code */
DellPaperCode dell1320c_paper_code(uint32_t width_pt, uint32_t height_pt);

/* Map paper name (e.g. "Letter", "A4") to code and dimensions */
int dell1320c_parse_paper(const char *name, DellPaperCode *code, int *w_pt, int *h_pt);

/* Write PJL job header and HBPL document initialization to output stream */
void dell1320c_write_job_header(FILE *out, const DellJobConfig *cfg);

/* Write HBPL document trailer and PJL End-Of-Job (EOJ) */
void dell1320c_write_job_trailer(FILE *out);

/* Compress and write a single 24-bit RGB page raster to output */
int dell1320c_write_page_rgb(FILE *out, const uint8_t *rgb_data, int width_px, int height_px,
                            const DellJobConfig *cfg, int page_num);

/* Compress and write a single 8-bit Grayscale page raster to output */
int dell1320c_write_page_mono(FILE *out, const uint8_t *mono_data, int line_size, int height_px,
                             const DellJobConfig *cfg, int page_num);

/* Process a PPM (Portable PixMap P6 or P5) stream and emit full HBPL print job */
int dell1320c_process_ppm(FILE *in, FILE *out, const DellJobConfig *cfg);

/* Process a Windows BMP bitmap stream and emit full HBPL print job */
int dell1320c_process_bmp(FILE *in, FILE *out, const DellJobConfig *cfg);

/* Send a raw buffer or file directly to networked Dell 1320c over TCP Port 9100 */
int dell1320c_send_network(const char *hostname_or_ip, int port, const uint8_t *data, size_t size);

/* Send a raw buffer or file directly to Windows USB port (e.g. "\\\\.\\USB001") */
int dell1320c_send_usb(const char *port_or_device_name, const uint8_t *data, size_t size);

/* Generate a self-contained Dell 1320c calibration/diagnostic test page (PPM format) */
uint8_t *dell1320c_generate_test_pattern(int width, int height, size_t *out_size);

#ifdef __cplusplus
}
#endif

#endif /* DELL1320C_ENGINE_H */
