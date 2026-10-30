path = r"c:\Antigravity Work\crypto-mc-calc\frontend\index.html"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

snippet = """    <!-- Main JS Application Controller -->
    <!-- Uncomment when testing interactive calculations and card generation -->
    <!-- <script type="module" src="./scripts/app.js"></script> -->

</body>"""

c = c.replace("</body>", snippet)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Added app.js reference in frontend/index.html")
