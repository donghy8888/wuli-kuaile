#!/usr/bin/env python3
"""把 index.html + css + js 打包成一个可离线打开的单文件：dist/快乐掌握物理.html"""
import re, os
d = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(d, 'index.html'), encoding='utf-8').read()
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', lambda m: '<style>\n' + open(os.path.join(d, m.group(1)), encoding='utf-8').read() + '</style>', html)
html = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>\n' + open(os.path.join(d, m.group(1)), encoding='utf-8').read().replace('</script', '<\\/script') + '</script>', html)
os.makedirs(os.path.join(d, 'dist'), exist_ok=True)
out = os.path.join(d, 'dist', '快乐掌握物理.html')
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html.encode()), 'bytes')
