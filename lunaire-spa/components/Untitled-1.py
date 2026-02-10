#!/usr/bin/env python3

input_file = "input.txt"
output_file = "output.txt"

with open(input_file, "r", encoding="utf-8", errors="ignore") as fin, \
     open(output_file, "w", encoding="utf-8") as fout:
    for line in fin:
        line = line.rstrip("\n")
        if line:
            fout.write(f"socks5://{line}\n")
        else:
            fout.write("\n")