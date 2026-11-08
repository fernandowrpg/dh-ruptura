"""Gera os tokens do andar 3 (O Cofre que Mente) no tamanho do Foundry.
256 px por quadrado do grid: 0.5 -> 128, 1 -> 256, 2 -> 512."""
import math, os, sys, json
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageChops

SRC = os.path.join(os.path.dirname(__file__), "src2mt")  # artes do 2-Minute Tabletop
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
W = 1024  # desenho interno, reduzido no fim
PX = 256

def tint(im, color, keep=0.55):
    """Colore uma arte em tons de cinza mantendo o traço preto."""
    r, g, b, a = im.split()
    gray = ImageOps.grayscale(im.convert("RGB"))
    col = ImageOps.colorize(gray, black="#0b0806", white=color, mid=None)
    col = Image.blend(col, Image.merge("RGB", (gray, gray, gray)), 1 - keep) if keep < 1 else col
    col.putalpha(a)
    return col

def sticker(draw_fn):
    """Desenha arte genérica com contorno preto + borda branca, estilo adesivo."""
    art = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(art))
    a = art.split()[3]
    white = a.filter(ImageFilter.MaxFilter(41))
    base = Image.new("RGBA", (W, W), (255, 255, 255, 0))
    base.putalpha(white)
    base = Image.alpha_composite(base, art)
    return base

def ring_colors(kind):
    if kind == "boss":
        return [(255, 236, 170), (214, 162, 58), (124, 82, 16), (46, 28, 4)]
    return [(247, 207, 166), (179, 110, 54), (92, 48, 16), (36, 18, 4)]

def make_token(art, kind, bg):
    tok = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    m = Image.new("L", (W, W), 0)
    d = ImageDraw.Draw(m)
    pad = 30
    d.ellipse([pad, pad, W - pad, W - pad], fill=255)
    # fundo: gradiente radial escuro
    g = Image.new("RGBA", (W, W), bg[1] + (255,))
    gd = ImageDraw.Draw(g)
    for i in range(60):
        t = i / 60
        rr = int((W / 2) * (1 - t))
        c = tuple(int(bg[1][k] + (bg[0][k] - bg[1][k]) * t) for k in range(3))
        gd.ellipse([W / 2 - rr, W / 2 - rr * 0.95 - 40 * t, W / 2 + rr, W / 2 + rr * 0.95 - 40 * t], fill=c + (255,))
    # grade de cofre sutil
    gd2 = ImageDraw.Draw(g)
    for x in range(0, W, 96):
        gd2.line([(x, 0), (x, W)], fill=(255, 220, 160, 14), width=3)
        gd2.line([(0, x), (W, x)], fill=(255, 220, 160, 14), width=3)
    tok.paste(g, (0, 0), m)
    # arte centralizada, ocupa ~78% do disco
    bbox = art.getbbox()
    a = art.crop(bbox)
    s = 0.80 * (W - 2 * pad) / max(a.size)
    a = a.resize((max(1, int(a.width * s)), max(1, int(a.height * s))), Image.LANCZOS)
    sh = Image.new("RGBA", a.size, (0, 0, 0, 0))
    sh.putalpha(a.split()[3].point(lambda v: int(v * 0.55)))
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    layer = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    ox, oy = (W - a.width) // 2, (W - a.height) // 2 + 10
    layer.alpha_composite(sh, (ox + 10, oy + 22))
    layer.alpha_composite(a, (ox, oy))
    clip = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    clip.paste(layer, (0, 0), ImageChops.multiply(layer.split()[3], m))
    tok = Image.alpha_composite(tok, clip)
    # aro metálico
    rd = ImageDraw.Draw(tok)
    light, mid, dark, edge = ring_colors(kind)
    width = 46 if kind == "boss" else 36
    for i in range(width):
        t = i / width
        col = tuple(int(dark[k] + (light[k] - dark[k]) * math.sin(math.pi * t)) for k in range(3))
        r = W / 2 - pad + width / 2 - i
        rd.ellipse([W / 2 - r, W / 2 - r, W / 2 + r, W / 2 + r], outline=col + (255,), width=2)
    for r, c, wd in [(W / 2 - pad + width / 2 + 2, edge, 6), (W / 2 - pad - width / 2 - 1, edge, 5)]:
        rd.ellipse([W / 2 - r, W / 2 - r, W / 2 + r, W / 2 + r], outline=c + (255,), width=wd)
    # rebites
    n = 12 if kind == "boss" else 8
    for i in range(n):
        ang = 2 * math.pi * i / n - math.pi / 2
        cx = W / 2 + (W / 2 - pad) * math.cos(ang)
        cy = W / 2 + (W / 2 - pad) * math.sin(ang)
        rd.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=light + (255,), outline=edge + (255,), width=3)
    if kind == "boss":
        # selo de runa no topo
        rd.ellipse([W / 2 - 46, 8, W / 2 + 46, 100], fill=dark + (255,), outline=light + (255,), width=6)
        rd.polygon([(W / 2, 26), (W / 2 + 22, 54), (W / 2, 84), (W / 2 - 22, 54)], outline=light + (255,), width=6)
    return tok

# ---------- artes genéricas ----------
INK = (16, 12, 10, 255)
def teeth(d, x0, x1, y, h, n, up=False):
    step = (x1 - x0) / n
    for i in range(n):
        a = x0 + i * step
        pts = [(a, y), (a + step, y), (a + step / 2, y - h if up else y + h)]
        d.polygon(pts, fill=(240, 236, 220, 255), outline=INK, width=6)

def draw_wagon(d):
    d.rounded_rectangle([170, 330, 860, 640], 40, fill=(122, 74, 38, 255), outline=INK, width=14)
    for x in range(250, 860, 120):
        d.line([(x, 340), (x, 630)], fill=(92, 52, 24, 255), width=10)
    d.rectangle([170, 470, 860, 560], fill=(70, 10, 18, 255), outline=INK, width=12)
    teeth(d, 190, 840, 470, 60, 10)
    teeth(d, 190, 840, 560, 60, 10, up=True)
    d.ellipse([600, 500, 760, 545], fill=(196, 64, 86, 255), outline=INK, width=8)
    for cx in (300, 730):
        d.ellipse([cx - 120, 560, cx + 120, 800], fill=(84, 54, 30, 255), outline=INK, width=14)
        d.ellipse([cx - 30, 650, cx + 30, 710], fill=(196, 150, 70, 255), outline=INK, width=8)
        for k in range(8):
            ang = k * math.pi / 4
            d.line([(cx, 680), (cx + 100 * math.cos(ang), 680 + 100 * math.sin(ang))], fill=INK, width=8)
    d.ellipse([360, 380, 430, 450], fill=(255, 220, 60, 255), outline=INK, width=8)
    d.ellipse([388, 400, 408, 440], fill=INK)
    d.ellipse([600, 380, 670, 450], fill=(255, 220, 60, 255), outline=INK, width=8)
    d.ellipse([628, 400, 648, 440], fill=INK)
    d.line([(860, 520), (980, 470)], fill=(84, 54, 30, 255), width=26)

def draw_barrel(d):
    d.rounded_rectangle([300, 170, 724, 860], 160, fill=(150, 92, 46, 255), outline=INK, width=14)
    for y in (300, 730):
        d.rectangle([292, y - 22, 732, y + 22], fill=(96, 100, 108, 255), outline=INK, width=8)
    for x in (400, 512, 624):
        d.line([(x, 190), (x, 840)], fill=(110, 64, 30, 255), width=8)
    d.ellipse([340, 430, 690, 640], fill=(70, 10, 18, 255), outline=INK, width=12)
    teeth(d, 370, 660, 470, 50, 7)
    teeth(d, 370, 660, 610, 50, 7, up=True)
    d.ellipse([440, 540, 590, 600], fill=(196, 64, 86, 255), outline=INK, width=8)
    d.ellipse([470, 340, 560, 420], fill=(255, 220, 60, 255), outline=INK, width=8)
    d.ellipse([505, 355, 525, 405], fill=INK)

def draw_jewels(d):
    gems = [((380, 420), (90, 200, 240)), ((610, 380), (220, 60, 80)), ((500, 600), (120, 220, 120)),
            ((300, 650), (200, 120, 240)), ((700, 620), (250, 200, 70)), ((520, 290), (240, 120, 60)),
            ((760, 450), (90, 200, 240))]
    for (cx, cy), c in gems:
        r = 95
        pts = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in [i * math.pi / 3 + math.pi / 6 for i in range(6)]]
        d.polygon(pts, fill=c + (255,), outline=INK, width=12)
        d.polygon([(cx - 40, cy - 30), (cx + 40, cy - 30), (cx, cy + 50)], fill=tuple(min(255, v + 60) for v in c) + (255,))
        d.ellipse([cx - 22, cy - 10, cx + 22, cy + 30], fill=(255, 245, 200, 255), outline=INK, width=6)
        d.ellipse([cx - 6, cy, cx + 6, cy + 22], fill=INK)
    d.arc([380, 700, 640, 860], 20, 160, fill=INK, width=12)
    teeth(d, 430, 600, 780, 30, 5)

def draw_crossbow(d):
    d.rounded_rectangle([470, 200, 560, 860], 30, fill=(110, 70, 36, 255), outline=INK, width=12)
    d.arc([180, 180, 850, 560], 200, 340, fill=INK, width=40)
    d.arc([180, 180, 850, 560], 200, 340, fill=(140, 140, 150, 255), width=22)
    d.line([(225, 300), (515, 520), (805, 300)], fill=(230, 220, 190, 255), width=8)
    d.polygon([(515, 120), (480, 220), (550, 220)], fill=(120, 210, 90, 255), outline=INK, width=8)
    for y in (560, 680):
        for sx in (-1, 1):
            d.line([(515, y), (515 + sx * 170, y + 70), (515 + sx * 220, y + 150)], fill=INK, width=22)
            d.line([(515, y), (515 + sx * 170, y + 70), (515 + sx * 220, y + 150)], fill=(150, 110, 70, 255), width=10)
    d.ellipse([480, 400, 550, 470], fill=(255, 220, 60, 255), outline=INK, width=8)
    d.ellipse([505, 412, 525, 458], fill=INK)
    for x, y in [(560, 260), (600, 330), (420, 300)]:
        d.ellipse([x - 16, y - 16, x + 16, y + 26], fill=(120, 210, 90, 255), outline=INK, width=5)

def src(name):
    return Image.open(os.path.join(SRC, name + ".png")).convert("RGBA")

BRONZE_BG = ((58, 44, 30), (16, 12, 9))
BOSS_BG = ((80, 30, 34), (18, 8, 10))
VOID_BG = ((44, 36, 64), (12, 10, 18))
GREEN_BG = ((40, 58, 36), (10, 14, 9))

TOKENS = [
    # arquivo, nome, quadrados no Foundry, tipo do aro, fundo, arte
    ("caixa-de-batalha", "Caixa de Batalha", 2, "boss", BOSS_BG, lambda: src("beholdenbox1")),
    ("mimicarroca", "Mimicarroça", 2, "normal", BRONZE_BG, lambda: sticker(draw_wagon)),
    ("mimico-gigante", "Mímico gigante", 2, "normal", BRONZE_BG, lambda: ImageOps.mirror(tint(src("mimicchest"), (196, 82, 62), 0.95))),
    ("mimico-venenoso", "Mímico venenoso", 1, "normal", GREEN_BG, lambda: sticker(draw_crossbow)),
    ("mimico", "Mímico", 1, "normal", BRONZE_BG, lambda: tint(src("mimicchest"), (214, 168, 92), 0.85)),
    ("mimibarril", "Mimibarril", 1, "normal", BRONZE_BG, lambda: sticker(draw_barrel)),
    ("mimijoias", "Mimijoias", 1, "normal", BRONZE_BG, lambda: sticker(draw_jewels)),
    ("olho-solitario", "Olho solitário", 0.5, "normal", VOID_BG, lambda: tint(src("gazer"), (170, 200, 255), 0.95)),
    ("olho-comandante", "Olho comandante", 0.5, "normal", VOID_BG, lambda: src("beholder")),
    ("espectador", "Espectador", 1, "normal", VOID_BG, lambda: src("spectator")),
    ("experimento-fracassado", "Experimento fracassado", 1, "normal", GREEN_BG, lambda: src("fleshgolem")),
    ("cranio-do-caos", "Crânio do caos", 0.5, "normal", GREEN_BG, lambda: src("flameskull")),
    ("cultista-adepto", "Cultista adepto (supervisor)", 1, "normal", BRONZE_BG, lambda: src("cultist2")),
]

manifest = []
for slug, name, units, kind, bg, art in TOKENS:
    tok = make_token(art(), kind, bg)
    size = int(PX * units)
    tok = tok.resize((size, size), Image.LANCZOS)
    label = f"{units:g}x{units:g}"
    fn = f"{slug}-{label}.png"
    tok.save(os.path.join(OUT, fn), optimize=True)
    manifest.append({"arquivo": fn, "nome": name, "tamanho_foundry": units, "pixels": size})
    print(fn, size)

json.dump(manifest, open(os.path.join(OUT, "tokens.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
