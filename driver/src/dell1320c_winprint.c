/**
 * dell1320c_winprint.c - Windows Print Processor, Filter, and Port Dispatcher for Dell 1320c
 * Supports Windows 32-bit (x86), 64-bit (x64), and ARM64.
 *
 * Can be used as:
 *  1. Windows Command-Line Print Tool:
 *     dell1320c_winprint.exe -i job.ppm -o job.hbpl
 *     dell1320c_winprint.exe -i page.bmp --host 192.168.1.100
 *     dell1320c_winprint.exe --test-page --host 192.168.1.100
 *  2. Windows Print Spooler Pipe Filter (e.g. via RedMon / mfilemon / Custom Spool Monitor):
 *     type spool.ppm | dell1320c_winprint.exe --pipe-mode > \\.\USB001
 *  3. Ghostscript Windows Pipeline:
 *     gswin64c -q -dNOPAUSE -dBATCH -sDEVICE=ppmraw -r600 -sOutputFile=- doc.pdf | dell1320c_winprint.exe --host 192.168.1.50
 */

#include "dell1320c_engine.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
  #include <winsock2.h>
  #include <windows.h>
  #include <io.h>
  #include <fcntl.h>
  #define SET_BINARY_MODE(handle) _setmode(_fileno(handle), _O_BINARY)
#else
  #include <unistd.h>
  #define SET_BINARY_MODE(handle) ((void)0)
#endif

#if defined(_M_ARM64) || defined(__aarch64__)
  #define ARCH_NAME "Windows ARM64 (AArch64)"
#elif defined(_M_X64) || defined(__x86_64__)
  #define ARCH_NAME "Windows 64-bit (x64 / AMD64)"
#elif defined(_M_IX86) || defined(__i386__)
  #define ARCH_NAME "Windows 32-bit (x86)"
#else
  #define ARCH_NAME "Universal Architecture"
#endif

static void print_usage(const char *prog) {
    printf("Dell Color Laser 1320c Windows Print Engine\n");
    printf("Architecture: %s\n", ARCH_NAME);
    printf("Based on open-source driver biosed/dell-1320c-cups-driver\n\n");
    printf("Usage: %s [options]\n\n", prog);
    printf("Options:\n");
    printf("  -i <file>         Input raster file (.ppm, .bmp, or '-' for stdin)\n");
    printf("  -o <file>         Output file for HBPL raw stream (or '-' for stdout)\n");
    printf("  --host <ip>       Directly stream to network printer IP (Port 9100)\n");
    printf("  --port <port>     Network port (default 9100)\n");
    printf("  --usb <device>    Directly stream to USB port (e.g. \\\\.\\USB001 or LPT1)\n");
    printf("  --paper <name>    Paper size: Letter (default), A4, Legal, Executive, B5, Env10, Monarch, DL, C5\n");
    printf("  --tray <name>     Paper tray: 1 (standard tray, default), 2 (optional), bypass, auto\n");
    printf("  --color           Full color mode (default)\n");
    printf("  --mono            Monochrome / Grayscale mode\n");
    printf("  --dpi <300|600>   Print resolution (default: 600)\n");
    printf("  --copies <n>      Number of copies (default: 1)\n");
    printf("  --title <title>   Print job title metadata\n");
    printf("  --user <user>     Submitting username\n");
    printf("  --test-page       Generate and print built-in Dell 1320c calibration page\n");
    printf("  --pipe-mode       Spooler pipe mode (binary stdin to binary stdout)\n");
    printf("  --version         Display version and architecture info\n");
    printf("  -h, --help        Show this help text\n");
}

int main(int argc, char *argv[]) {
    DellJobConfig cfg;
    dell1320c_default_config(&cfg);

    const char *input_file = NULL;
    const char *output_file = NULL;
    const char *host = NULL;
    int net_port = 9100;
    const char *usb_port = NULL;
    int generate_test = 0;
    int pipe_mode = 0;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        } else if (strcmp(argv[i], "--version") == 0) {
            printf("dell1320c_winprint v1.2.0 (%s)\n", ARCH_NAME);
            return 0;
        } else if (strcmp(argv[i], "-i") == 0 && i + 1 < argc) {
            input_file = argv[++i];
        } else if (strcmp(argv[i], "-o") == 0 && i + 1 < argc) {
            output_file = argv[++i];
        } else if (strcmp(argv[i], "--host") == 0 && i + 1 < argc) {
            host = argv[++i];
        } else if (strcmp(argv[i], "--port") == 0 && i + 1 < argc) {
            net_port = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--usb") == 0 && i + 1 < argc) {
            usb_port = argv[++i];
        } else if (strcmp(argv[i], "--paper") == 0 && i + 1 < argc) {
            DellPaperCode code;
            int w, h;
            if (dell1320c_parse_paper(argv[++i], &code, &w, &h) == 0) {
                cfg.paper = code;
                cfg.width_pt = w;
                cfg.height_pt = h;
            }
        } else if (strcmp(argv[i], "--tray") == 0 && i + 1 < argc) {
            const char *t = argv[++i];
            if (strcmp(t, "1") == 0 || strcasecmp(t, "tray1") == 0) cfg.tray = DELL1320C_TRAY_1;
            else if (strcmp(t, "2") == 0 || strcasecmp(t, "tray2") == 0) cfg.tray = DELL1320C_TRAY_2;
            else if (strcasecmp(t, "bypass") == 0) cfg.tray = DELL1320C_TRAY_BYPASS;
            else if (strcasecmp(t, "auto") == 0) cfg.tray = DELL1320C_TRAY_AUTO;
        } else if (strcmp(argv[i], "--color") == 0) {
            cfg.color_mode = DELL1320C_MODE_COLOR;
        } else if (strcmp(argv[i], "--mono") == 0) {
            cfg.color_mode = DELL1320C_MODE_MONO;
        } else if (strcmp(argv[i], "--dpi") == 0 && i + 1 < argc) {
            cfg.dpi = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--copies") == 0 && i + 1 < argc) {
            cfg.copies = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--title") == 0 && i + 1 < argc) {
            strncpy(cfg.title, argv[++i], sizeof(cfg.title) - 1);
        } else if (strcmp(argv[i], "--user") == 0 && i + 1 < argc) {
            strncpy(cfg.user, argv[++i], sizeof(cfg.user) - 1);
        } else if (strcmp(argv[i], "--test-page") == 0) {
            generate_test = 1;
        } else if (strcmp(argv[i], "--pipe-mode") == 0) {
            pipe_mode = 1;
        }
    }

    /* Test page mode */
    if (generate_test) {
        int dpi = (cfg.dpi == 300) ? 300 : 600;
        int w_px = (cfg.width_pt * dpi) / 72;
        int h_px = (cfg.height_pt * dpi) / 72;
        size_t raw_sz = 0;
        uint8_t *pattern = dell1320c_generate_test_pattern(w_px, h_px, &raw_sz);
        if (!pattern) {
            fprintf(stderr, "Failed to allocate test pattern\n");
            return 1;
        }

        /* Write to temporary memory buffer or file */
        char tmp_path[512];
        #ifdef _WIN32
            GetTempPathA(sizeof(tmp_path), tmp_path);
            strcat(tmp_path, "dell1320c_test.hbpl");
        #else
            strcpy(tmp_path, "/tmp/dell1320c_test.hbpl");
        #endif

        FILE *f_out = fopen(tmp_path, "wb");
        if (!f_out) {
            fprintf(stderr, "Cannot create temporary file: %s\n", tmp_path);
            free(pattern);
            return 1;
        }

        strncpy(cfg.title, "Dell 1320c Test Page", sizeof(cfg.title) - 1);
        dell1320c_write_job_header(f_out, &cfg);
        dell1320c_write_page_rgb(f_out, pattern, w_px, h_px, &cfg, 1);
        dell1320c_write_job_trailer(f_out);
        fclose(f_out);
        free(pattern);

        printf("Generated test page HBPL job -> %s\n", tmp_path);

        /* Send if target specified */
        if (host) {
            printf("Sending test page to network printer %s:%d...\n", host, net_port);
            FILE *tf = fopen(tmp_path, "rb");
            if (tf) {
                fseek(tf, 0, SEEK_END);
                long fsz = ftell(tf);
                fseek(tf, 0, SEEK_SET);
                uint8_t *buf = (uint8_t*)malloc((size_t)fsz);
                if (buf && fread(buf, 1, (size_t)fsz, tf) == (size_t)fsz) {
                    int r = dell1320c_send_network(host, net_port, buf, (size_t)fsz);
                    if (r == 0) printf("Print job successfully transmitted to %s:%d!\n", host, net_port);
                    else fprintf(stderr, "Failed to transmit job (error %d)\n", r);
                }
                free(buf);
                fclose(tf);
            }
        } else if (usb_port) {
            printf("Sending test page to USB printer %s...\n", usb_port);
            FILE *tf = fopen(tmp_path, "rb");
            if (tf) {
                fseek(tf, 0, SEEK_END);
                long fsz = ftell(tf);
                fseek(tf, 0, SEEK_SET);
                uint8_t *buf = (uint8_t*)malloc((size_t)fsz);
                if (buf && fread(buf, 1, (size_t)fsz, tf) == (size_t)fsz) {
                    int r = dell1320c_send_usb(usb_port, buf, (size_t)fsz);
                    if (r == 0) printf("Print job successfully written to USB port %s!\n", usb_port);
                    else fprintf(stderr, "Failed to write to USB port %s (error %d)\n", usb_port, r);
                }
                free(buf);
                fclose(tf);
            }
        } else if (output_file) {
            /* Copy to output_file */
            #ifdef _WIN32
                CopyFileA(tmp_path, output_file, 0);
            #else
                char cmd[1024];
                snprintf(cmd, sizeof(cmd), "cp %s %s", tmp_path, output_file);
                system(cmd);
            #endif
            printf("Saved HBPL test stream to %s\n", output_file);
        }
        return 0;
    }

    /* Open input file / stream */
    FILE *in = stdin;
    SET_BINARY_MODE(stdin);

    if (input_file && strcmp(input_file, "-") != 0) {
        in = fopen(input_file, "rb");
        if (!in) {
            fprintf(stderr, "Error opening input file: %s\n", input_file);
            return 1;
        }
    }

    /* Prepare output destination */
    FILE *out = stdout;
    SET_BINARY_MODE(stdout);
    int direct_send = (host != NULL || usb_port != NULL);

    char tmp_out[512] = "";
    if (direct_send) {
        #ifdef _WIN32
            GetTempPathA(sizeof(tmp_out), tmp_out);
            strcat(tmp_out, "dell1320c_spool.hbpl");
        #else
            strcpy(tmp_out, "/tmp/dell1320c_spool.hbpl");
        #endif
        out = fopen(tmp_out, "wb");
        if (!out) {
            fprintf(stderr, "Cannot create temporary spool file: %s\n", tmp_out);
            if (in != stdin) fclose(in);
            return 1;
        }
    } else if (output_file && strcmp(output_file, "-") != 0) {
        out = fopen(output_file, "wb");
        if (!out) {
            fprintf(stderr, "Error opening output file: %s\n", output_file);
            if (in != stdin) fclose(in);
            return 1;
        }
    }

    /* Detect file type: BMP or PPM */
    int magic0 = fgetc(in);
    int magic1 = fgetc(in);
    ungetc(magic1, in);
    ungetc(magic0, in);

    int status = 0;
    if (magic0 == 'B' && magic1 == 'M') {
        status = dell1320c_process_bmp(in, out, &cfg);
    } else {
        /* Default to PPM format */
        status = dell1320c_process_ppm(in, out, &cfg);
    }

    if (in != stdin) fclose(in);
    if (out != stdout) fclose(out);

    if (status != 0) {
        fprintf(stderr, "Error during raster conversion\n");
        return 1;
    }

    /* If direct sending requested */
    if (direct_send) {
        FILE *tf = fopen(tmp_out, "rb");
        if (tf) {
            fseek(tf, 0, SEEK_END);
            long fsz = ftell(tf);
            fseek(tf, 0, SEEK_SET);
            uint8_t *buf = (uint8_t*)malloc((size_t)fsz);
            if (buf && fread(buf, 1, (size_t)fsz, tf) == (size_t)fsz) {
                if (host) {
                    int r = dell1320c_send_network(host, net_port, buf, (size_t)fsz);
                    if (r == 0) printf("Print job (%ld bytes) successfully sent to %s:%d\n", fsz, host, net_port);
                    else fprintf(stderr, "Network transmission error: %d\n", r);
                } else if (usb_port) {
                    int r = dell1320c_send_usb(usb_port, buf, (size_t)fsz);
                    if (r == 0) printf("Print job (%ld bytes) successfully sent to %s\n", fsz, usb_port);
                    else fprintf(stderr, "USB transmission error: %d\n", r);
                }
            }
            free(buf);
            fclose(tf);
        }
    }

    return 0;
}
