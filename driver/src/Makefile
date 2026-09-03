# Makefile for Dell 1320c Windows & Multi-Platform Driver Engine
# Targets: Windows 32-bit (x86), Windows 64-bit (x64), Windows ARM64, and Native Host

CC_X86   ?= i686-w64-mingw32-gcc
CC_X64   ?= x86_64-w64-mingw32-gcc
CC_ARM64 ?= /opt/llvm-mingw/bin/aarch64-w64-mingw32-gcc
CC_HOST  ?= gcc

CFLAGS   = -O2 -Wall -Wextra -I.
WIN_LIBS = -lws2_32
HOST_LIBS = -lm

SRC = dell1320c_winprint.c dell1320c_engine.c sq21_simple.c

BIN_DIR = ../bin
OUT_X86   = $(BIN_DIR)/x86/dell1320c_winprint.exe
OUT_X64   = $(BIN_DIR)/x64/dell1320c_winprint.exe
OUT_ARM64 = $(BIN_DIR)/arm64/dell1320c_winprint.exe
OUT_HOST  = $(BIN_DIR)/dell1320c_engine_linux

.PHONY: all x86 x64 arm64 host clean

all: x86 x64 arm64 host

$(BIN_DIR)/x86:
	mkdir -p $(BIN_DIR)/x86

$(BIN_DIR)/x64:
	mkdir -p $(BIN_DIR)/x64

$(BIN_DIR)/arm64:
	mkdir -p $(BIN_DIR)/arm64

x86: $(BIN_DIR)/x86
	$(CC_X86) $(CFLAGS) -o $(OUT_X86) $(SRC) $(WIN_LIBS)
	cp $(OUT_X86) $(BIN_DIR)/x86/dell1320c_filter.exe

x64: $(BIN_DIR)/x64
	$(CC_X64) $(CFLAGS) -o $(OUT_X64) $(SRC) $(WIN_LIBS)
	cp $(OUT_X64) $(BIN_DIR)/x64/dell1320c_filter.exe

arm64: $(BIN_DIR)/arm64
	$(CC_ARM64) $(CFLAGS) -o $(OUT_ARM64) $(SRC) $(WIN_LIBS)
	cp $(OUT_ARM64) $(BIN_DIR)/arm64/dell1320c_filter.exe

host:
	$(CC_HOST) $(CFLAGS) -o $(OUT_HOST) $(SRC) $(HOST_LIBS)

clean:
	rm -f $(OUT_X86) $(OUT_X64) $(OUT_ARM64) $(OUT_HOST)
