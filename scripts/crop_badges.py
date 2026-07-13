#!/usr/bin/env python3
"""从 16 勋章合成大图中裁剪每个勋章图标，统一输出为 badge-{id}.jpg

v2 策略（视觉统一 + 自动居中）：
1. 4x4 等分网格定位每个单元格
2. 自动扫描每个单元格内非黑像素，检测「该勋章自身」的内容边界与中心
3. 以「自身内容半径 x PAD」作为该勋章的裁剪半径
   -> 所有勋章的本体在输出图里占比相同 => 视觉大小统一（二期偏小问题解决）
4. 以「自身内容中心」为裁剪中心
   -> 自动居中（无需全局平均，一夜暴富/十拿九稳等偏的问题解决）
5. 径向遮罩：把圆形勋章之外的亮像素（漏出的文字/星级/杂点）涂黑 -> 四周干净纯黑
6. 个别源图里重心检测仍偏差的勋章，用 OFFSET 字典做 ±px 微调
"""

import argparse
import os
import sys

from PIL import Image

# ============================================================
# 配置区
# ============================================================
# 16 勋章合成大图（4x4 网格）。可用 --source 覆盖，或把源图放到项目内 assets/badges_source.jpg
SOURCE_IMAGE = os.path.join(PROJECT_ROOT, "assets", "badges_source.jpg")
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "report", "badges")
OUTPUT_SIZE = (256, 256)  # 统一输出尺寸
JPEG_QUALITY = 92  # JPG 质量
GRID_ROWS = 4
GRID_COLS = 4
PAD = 1.15          # 裁剪半径 = 该勋章自身内容半径 x PAD（留约 15% 黑边）
THRESH = 45          # 非黑像素亮度阈值（R+G+B > THRESH 视为内容/文字）
SCAN_RATIO = 0.80    # 每个单元格只扫描上 80% 区域（排除下方文字/星星）
MASK_PAD = 1.03      # 遮罩半径 = 该勋章内容半径 x MASK_PAD（涂黑圆外漏出物）

# 16个勋章的 id 映射（按网格从左到右、从上到下顺序）
BADGE_IDS = [
    ["meierduka",       "maozixifa",      "sixilinmen",     "xiaoyouhuoshou"],     # Row 0
    ["caiyuanggungun",  "jinkubazhu",     "rijindoujin",    "yiwanfuweng"],        # Row 1
    ["kaimenhong",      "shinaojiuwen",   "baizhanbaisheng","jijunsaiyuyanjia"],   # Row 2
    ["juesaiyuyanjia",  "yiyebaofu",      "caishenjianglin","fuguizaitian"],       # Row 3
]

# 单独微调（单位=源图像素）：(dx, dy)，正值=右/下，负值=左/上
# 以「自身内容中心」裁剪后大部分已自动居中；此处仅校正检测仍偏差的个别勋章
# 以下 4 个源图里图案视觉重心偏下 -> dy 取正值使裁剪圆心下移=图案相对上抬
OFFSET = {
    "yiwanfuweng": (0, 4),       # 亿万富翁
    "baizhanbaisheng": (0, 4),   # 百战百胜
    "juesaiyuyanjia": (0, 4),    # 决赛预言家
    "fuguizaitian": (0, 4),      # 富贵在天
}


def detect_content(img, cw, ch):
    """扫描全部单元格，返回每个勋章的 (内容中心X, 内容中心Y, 内容半径)。"""
    px = img.load()
    info = [[None] * GRID_COLS for _ in range(GRID_ROWS)]
    for r in range(GRID_ROWS):
        for c in range(GRID_COLS):
            x0, y0 = c * cw, r * ch
            minx, maxx, miny, maxy = 10 ** 9, -1, 10 ** 9, -1
            for y in range(y0, int(y0 + ch * SCAN_RATIO)):
                for x in range(x0, x0 + cw):
                    R, G, B = px[x, y]
                    if R + G + B > THRESH:
                        if x < minx:
                            minx = x
                        if x > maxx:
                            maxx = x
                        if y < miny:
                            miny = y
                        if y > maxy:
                            maxy = y
            if maxx > minx:
                mcx = (minx + maxx) // 2
                mcy = (miny + maxy) // 2
                # 内容外接半径（取半宽/半高较大者，保证完整）
                rad = max((maxx - minx) / 2.0, (maxy - miny) / 2.0)
                info[r][c] = (mcx, mcy, rad)
    return info


def mask_outside(cropped, content_r):
    """把圆形勋章之外的亮像素（漏出的文字/杂点）涂黑，保持四周纯黑。
    cropped 尺寸 = 该勋章裁剪半径*2，圆心在图正中；content_r 为内容半径。"""
    w, h = cropped.size
    cx, cy = w // 2, h // 2
    mask_r = int(content_r * MASK_PAD)
    mr2 = mask_r * mask_r
    px = cropped.load()
    for y in range(h):
        for x in range(w):
            dx, dy = x - cx, y - cy
            if dx * dx + dy * dy > mr2:
                R, G, B = px[x, y]
                if R + G + B > THRESH:
                    px[x, y] = (0, 0, 0)
    return cropped


def main():
    parser = argparse.ArgumentParser(description="裁剪勋章图标 (v2: 视觉统一+自动居中)")
    parser.add_argument("--preview", action="store_true", help="预览模式：输出拼接图不替换原文件")
    parser.add_argument("--pad", type=float, default=PAD, help=f"黑边比例 (默认 {PAD})")
    parser.add_argument("--diagnose", action="store_true", help="打印每个勋章的中心偏移与内容半径")
    parser.add_argument("--source", type=str, default=SOURCE_IMAGE,
                        help="指定 16 勋章合成大图路径（默认 assets/badges_source.jpg）")
    args = parser.parse_args()

    src = args.source
    if not os.path.exists(src):
        print(f"[ERROR] 源图片不存在: {src}")
        sys.exit(1)

    img = Image.open(src).convert("RGB")
    w, h = img.size
    print(f"源图尺寸: {w} x {h}")

    cell_w = w // GRID_COLS
    cell_h = h // GRID_ROWS

    info = detect_content(img, cell_w, cell_h)

    if args.diagnose:
        print("\n[DIAGNOSE] 每勋章相对单元格中心的偏移 (dx,dy) 与内容半径 rad：")
        print("  dx>0=偏右  dy>0=偏下  (用于判断是否需要 OFFSET 微调)\n")

    results = []  # (badge_id, resized_image)
    for row in range(GRID_ROWS):
        for col in range(GRID_COLS):
            badge_id = BADGE_IDS[row][col]
            mcx, mcy, rad = info[row][col]
            ox, oy = OFFSET.get(badge_id, (0, 0))
            cx = mcx + ox
            cy = mcy + oy
            crop_r = int(rad * args.pad)
            box = (cx - crop_r, cy - crop_r, cx + crop_r, cy + crop_r)
            cropped = img.crop(box)
            # 径向遮罩：涂黑圆外漏出的文字/杂点
            cropped = mask_outside(cropped, rad)
            resized = cropped.resize(OUTPUT_SIZE, Image.Resampling.LANCZOS)
            results.append((badge_id, resized))
            if args.diagnose:
                cell_cx = col * cell_w + cell_w // 2
                cell_cy = row * cell_h + cell_h // 2
                dx = mcx - cell_cx
                dy = mcy - cell_cy
                print(f"  [{row},{col}] {badge_id:16s} dx={dx:+4d} dy={dy:+4d} rad={rad:5.1f} "
                      f"crop_r={crop_r} offset=({ox:+d},{oy:+d})")

    if args.preview:
        preview_path = os.path.join(PROJECT_ROOT, "badges_preview_v2.jpg")
        preview_grid = Image.new("RGB", (OUTPUT_SIZE[0] * GRID_COLS, OUTPUT_SIZE[1] * GRID_ROWS), "black")
        for i, (badge_id, badge_img) in enumerate(results):
            row, col = divmod(i, GRID_COLS)
            preview_grid.paste(badge_img, (col * OUTPUT_SIZE[0], row * OUTPUT_SIZE[1]))
        preview_grid.save(preview_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
        print(f"\n[PREVIEW] 预览图已保存: {preview_path}")
        print("请检查预览图，确认无误后去掉 --preview 参数正式执行。")
    else:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        for badge_id, badge_img in results:
            output_path = os.path.join(OUTPUT_DIR, f"badge-{badge_id}.jpg")
            badge_img.save(output_path, "JPEG", quality=JPEG_QUALITY, optimize=True)
            print(f"  [OK] {output_path}")
        typo_file = os.path.join(OUTPUT_DIR, "badge-caiyunggungun.jpg")
        if os.path.exists(typo_file):
            os.remove(typo_file)
            print(f"  [DEL] 已删除拼写错误文件: {typo_file}")
        print(f"\n完成！共生成 {len(results)} 个勋章图标 → {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
