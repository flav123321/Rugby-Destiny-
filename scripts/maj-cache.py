# Régénère la liste des fichiers mis en cache par le service worker (à lancer après avoir ajouté un fichier).
import os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = ['./', './index.html', './styles.css', './manifest.webmanifest'] + sorted('./icons/' + f for f in os.listdir(root + '/icons'))
for d, _, fs in os.walk(root + '/src'):
    for f in fs: files.append('./' + os.path.relpath(os.path.join(d, f), root))
files = sorted(set(files), key=lambda x: (x != './', x))
p = root + '/sw.js'; s = open(p).read()
s = re.sub(r"const FILES = \[.*?\];", "const FILES = [\n" + "\n".join(f"  '{f}'," for f in files) + "\n];", s, flags=re.S)
open(p, 'w').write(s)
