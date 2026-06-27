from PIL import Image, ImageDraw, ImageFont
import math, os

OUT = os.path.dirname(__file__)

# Colores
BLACK  = (0, 0, 0)
WHITE  = (255, 255, 255)
GOLD   = (212, 175, 85)
DIM    = (60, 60, 65)
HINT   = (100, 100, 105)
CARD   = (28, 28, 30)
BORDER = (45, 45, 48)

def draw_sun(draw, cx, cy, r_core, r_ray, n_rays=8, color=GOLD, alpha=200):
    draw.ellipse([cx-r_core, cy-r_core, cx+r_core, cy+r_core], fill=color)
    for i in range(n_rays):
        angle = math.radians(i * 360 / n_rays)
        x1 = cx + math.cos(angle) * (r_core + 3)
        y1 = cy + math.sin(angle) * (r_core + 3)
        x2 = cx + math.cos(angle) * r_ray
        y2 = cy + math.sin(angle) * r_ray
        draw.line([x1, y1, x2, y2], fill=color, width=2)

def draw_glow(img, cx, cy, radius, color=(212,175,85), max_alpha=30):
    overlay = Image.new('RGBA', img.size, (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    steps = 20
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(max_alpha * (1 - i/steps))
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, a))
    img.paste(overlay, mask=overlay)

def try_font(size, bold=False):
    paths = [
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except:
            pass
    return ImageFont.load_default()

def text_center(draw, text, y, font, color=WHITE, img_w=1024):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text(((img_w - w) // 2, y), text, font=font, fill=color)

# ── 1. FEATURE GRAPHIC 1024×500 ──────────────────────────────────────────────
def make_feature():
    W, H = 1024, 500
    img = Image.new('RGB', (W, H), BLACK)
    draw = ImageDraw.Draw(img)
    draw_glow(img, W//2, H//2, 350)

    # Ícono
    ix, iy, ir = W//2, 160, 36
    draw.rounded_rectangle([ix-ir-10, iy-ir-10, ix+ir+10, iy+ir+10], radius=14, fill=CARD, outline=(*GOLD, 80), width=1)
    draw_sun(draw, ix, iy, 10, 32)

    # Logo
    f_logo = try_font(90)
    text_center(draw, "SOLEN", 210, f_logo, WHITE, W)

    # Tagline
    f_tag = try_font(16)
    text_center(draw, "S I S T E M A  D E  I D E N T I D A D", 315, f_tag, (*HINT, 255), W)

    # Pills
    pills = ["Neurociencia", "Bienestar", "Identidad"]
    pill_y = 365
    total_w = sum(80 + len(p)*8 for p in pills) + 20*(len(pills)-1)
    px = (W - total_w) // 2
    f_pill = try_font(13)
    for p in pills:
        pw = 80 + len(p)*8
        draw.rounded_rectangle([px, pill_y, px+pw, pill_y+30], radius=15, outline=BORDER, width=1)
        bbox = draw.textbbox((0,0), p, font=f_pill)
        tx = px + (pw - (bbox[2]-bbox[0])) // 2
        draw.text((tx, pill_y+7), p, font=f_pill, fill=(*HINT,255))
        px += pw + 20

    img.save(os.path.join(OUT, "feature-graphic.png"))
    print("✓ feature-graphic.png (1024×500)")

# ── 2. PANTALLA DE TELÉFONO 1080×1920 ────────────────────────────────────────
def make_phone_screen(filename, screen_num):
    W, H = 1080, 1920
    img = Image.new('RGB', (W, H), BLACK)
    draw = ImageDraw.Draw(img)
    draw_glow(img, W//2, 500, 500)

    f_small = try_font(28)
    f_med   = try_font(42)
    f_large = try_font(72)
    f_tiny  = try_font(22)

    if screen_num == 1:
        # Login screen
        # Ícono
        draw.rounded_rectangle([W//2-60, 220, W//2+60, 340], radius=28, fill=CARD, outline=(*GOLD,80), width=1)
        draw_sun(draw, W//2, 280, 18, 52)
        text_center(draw, "SOLEN", 380, f_large, WHITE, W)
        text_center(draw, "S I S T E M A  D E  I D E N T I D A D", 480, f_tiny, (*HINT,255), W)
        # Inputs
        draw.rounded_rectangle([120, 620, W-120, 720], radius=20, fill=CARD, outline=BORDER, width=1)
        draw.text((160, 655), "Email", font=f_small, fill=(*HINT,255))
        draw.rounded_rectangle([120, 760, W-120, 860], radius=20, fill=CARD, outline=BORDER, width=1)
        draw.text((160, 795), "Contraseña", font=f_small, fill=(*HINT,255))
        # Botón
        draw.rounded_rectangle([120, 920, W-120, 1040], radius=20, fill=WHITE)
        bbox = draw.textbbox((0,0), "Iniciar sesión", font=f_med)
        tx = (W - (bbox[2]-bbox[0])) // 2
        draw.text((tx, 960), "Iniciar sesión", font=f_med, fill=BLACK)
        text_center(draw, "¿Primera vez?  Crear cuenta", 1100, f_small, (*HINT,255), W)

    elif screen_num == 2:
        # Home screen
        text_center(draw, "Buenos días, Florencia", 160, f_med, WHITE, W)
        text_center(draw, "ROUND UNO · 5:00 AM", 230, f_tiny, (*GOLD,200), W)

        # Dash cards
        for i, (label, val) in enumerate([("Creación", "72%"), ("Racha", "5"), ("Bio-Hack", "3")]):
            cx = 120 + i * 290
            draw.rounded_rectangle([cx, 310, cx+260, 430], radius=16, fill=CARD, outline=BORDER, width=1)
            bbox = draw.textbbox((0,0), val, font=f_med)
            tx = cx + (260 - (bbox[2]-bbox[0])) // 2
            draw.text((tx, 330), val, font=f_med, fill=WHITE)
            bbox2 = draw.textbbox((0,0), label, font=f_tiny)
            tx2 = cx + (260 - (bbox2[2]-bbox2[0])) // 2
            draw.text((tx2, 390), label, font=f_tiny, fill=(*HINT,255))

        # Selector
        draw.rounded_rectangle([80, 480, W-80, 660], radius=24, fill=CARD, outline=BORDER, width=1)
        draw.text((120, 510), "CREACIÓN", font=f_tiny, fill=(*HINT,255))
        draw.text((120, 560), "78", font=f_large, fill=WHITE)
        draw.rounded_rectangle([120, 630, W-160, 636], radius=3, fill=BORDER)
        draw.rounded_rectangle([120, 630, 120+int((W-280)*0.78), 636], radius=3, fill=WHITE)

        # Rounds
        draw.text((80, 720), "ROUNDS DEL DÍA", font=f_tiny, fill=(*HINT,255))
        rounds = [("Round Uno", "5:00 AM · +15–50 pts"), ("Acción Masiva", "90 min · +40 pts"), ("Pineal", "22:00 · +20 pts")]
        ry = 780
        for title, sub in rounds:
            draw.rounded_rectangle([80, ry, W-80, ry+110], radius=16, fill=CARD, outline=BORDER, width=1)
            draw.text((120, ry+20), title, font=f_small, fill=WHITE)
            draw.text((120, ry+62), sub, font=f_tiny, fill=(*HINT,255))
            draw.text((W-160, ry+38), "→", font=f_med, fill=(*HINT,255))
            ry += 130

    img.save(os.path.join(OUT, filename))
    print(f"✓ {filename} (1080×1920)")

# ── 3. TABLET 7" 1200×1920 ───────────────────────────────────────────────────
def make_tablet_7():
    W, H = 1200, 1920
    img = Image.new('RGB', (W, H), BLACK)
    draw = ImageDraw.Draw(img)
    draw_glow(img, W//4, H//2, 500)

    f_small = try_font(30)
    f_med   = try_font(44)
    f_large = try_font(80)
    f_tiny  = try_font(24)

    # Panel izquierdo — marca
    lw = W // 2
    draw.line([lw, 0, lw, H], fill=BORDER, width=1)
    draw_sun(draw, lw//2, 500, 22, 65)
    text_center(draw, "SOLEN", 600, f_large, WHITE, lw)
    text_center(draw, "SISTEMA DE IDENTIDAD", 710, f_tiny, (*HINT,255), lw)

    desc = "Forjá quien sos cada día"
    bbox = draw.textbbox((0,0), desc, font=f_small)
    draw.text(((lw-(bbox[2]-bbox[0]))//2, 800), desc, font=f_small, fill=(*HINT,200))

    # Panel derecho — form
    rx = lw + 80
    draw.text((rx, 500), "Bienvenida", font=f_med, fill=WHITE)
    draw.text((rx, 570), "Ingresá para continuar", font=f_tiny, fill=(*HINT,255))
    draw.rounded_rectangle([rx, 650, W-80, 760], radius=18, fill=CARD, outline=BORDER, width=1)
    draw.text((rx+40, 688), "Email", font=f_small, fill=(*HINT,255))
    draw.rounded_rectangle([rx, 800, W-80, 910], radius=18, fill=CARD, outline=BORDER, width=1)
    draw.text((rx+40, 838), "Contraseña", font=f_small, fill=(*HINT,255))
    draw.rounded_rectangle([rx, 960, W-80, 1080], radius=18, fill=WHITE)
    bbox = draw.textbbox((0,0), "Iniciar sesión", font=f_med)
    tx = rx + ((W-80-rx) - (bbox[2]-bbox[0])) // 2
    draw.text((tx, 998), "Iniciar sesión", font=f_med, fill=BLACK)

    img.save(os.path.join(OUT, "tablet-7.png"))
    print("✓ tablet-7.png (1200×1920)")

# ── 4. TABLET 10" 1600×2560 ──────────────────────────────────────────────────
def make_tablet_10():
    W, H = 1600, 2560
    img = Image.new('RGB', (W, H), BLACK)
    draw = ImageDraw.Draw(img)
    draw_glow(img, W//4, H//2, 700)

    f_small = try_font(36)
    f_med   = try_font(54)
    f_large = try_font(110)
    f_tiny  = try_font(28)
    f_xs    = try_font(22)

    lw = W // 2
    draw.line([lw, 0, lw, H], fill=BORDER, width=1)

    draw_sun(draw, lw//2, 680, 28, 88)
    text_center(draw, "SOLEN", 810, f_large, WHITE, lw)
    text_center(draw, "SISTEMA DE IDENTIDAD", 960, f_tiny, (*HINT,255), lw)

    features = ["Tres Rounds diarios", "Protocolos por estado", "Coach de IA", "Journals de identidad"]
    fy = 1100
    for feat in features:
        fx = lw//2 - 200
        draw.ellipse([fx, fy+8, fx+16, fy+24], fill=(*GOLD,150))
        draw.text((fx+30, fy), feat, font=f_xs, fill=(*HINT,200))
        fy += 60

    rx = lw + 120
    draw.text((rx, 680), "Bienvenida", font=f_med, fill=WHITE)
    draw.text((rx, 760), "Ingresá para continuar", font=f_tiny, fill=(*HINT,255))
    for i, ph in enumerate(["Email", "Contraseña"]):
        ry = 880 + i*190
        draw.rounded_rectangle([rx, ry, W-120, ry+130], radius=22, fill=CARD, outline=BORDER, width=1)
        draw.text((rx+50, ry+42), ph, font=f_small, fill=(*HINT,255))
    draw.rounded_rectangle([rx, 1300, W-120, 1450], radius=22, fill=WHITE)
    bbox = draw.textbbox((0,0), "Iniciar sesión", font=f_med)
    tx = rx + ((W-120-rx) - (bbox[2]-bbox[0])) // 2
    draw.text((tx, 1350), "Iniciar sesión", font=f_med, fill=BLACK)

    img.save(os.path.join(OUT, "tablet-10.png"))
    print("✓ tablet-10.png (1600×2560)")

make_feature()
make_phone_screen("phone-login.png", 1)
make_phone_screen("phone-home.png", 2)
make_tablet_7()
make_tablet_10()
print("\n✅ Todas las imágenes generadas en store-assets/")
