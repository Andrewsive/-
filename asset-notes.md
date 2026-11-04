# 画面素材说明

- `dist/assets/xixi-reference.png`：用户提供的原始参考图，1448 × 1086。
- `dist/assets/clean-background.png`：使用内置 imagegen 编辑生成的动画背景底板，1448 × 1086。已清理底部九盏独立花灯及中央悬浮宫灯、S 形流光，以供 Canvas 灯体与特效独立绘制。
- 原始图像保留，生成结果以新文件保存。建筑屋檐、右侧墙体轮廓、五字题字、梅枝、月亮、云纹、河流桥阁与地面在视觉检查中保持原有构图。生成编辑仍可能重建被移除对象附近的小范围水面纹理。

## 图像编辑提示词（内置 imagegen）

Use case: precise-object-edit. Asset type: exact background plate for an interactive projection web demo. Image 1 is the edit target. Preserve its original 4:3 frame and 1448x1086 composition, camera, architecture, textures and lighting. Remove ONLY the nine freestanding lanterns along the lower wall at approximate centres (160,806), (294,809), (426,810), (557,823), (708,811), (833,808), (953,807), (1067,808), (1168,810), plus the single floating palace lantern at (580,640), its S-shaped golden luminous trail down to (550,820), and the few petals directly surrounding that trail. Fill the small removed lower-lantern areas with the same continuous painted river and warm golden water reflections. Fill the floating-lantern and trail areas with the same cream wall and subtle existing landscape/cloud background. Keep the rest of the source absolutely unchanged: all black roof tiles, exact stepped wall silhouette on the right, trees, night sky, stone ground and reflections, lower Song-dynasty river landscape with pavilions, distant mountains and bridge, left flowering plum branches and hanging lantern, right full moon and all cloud lines, right flowers and lotus pond. The five black Chinese characters '西溪且留下' must stay exact and unchanged at their existing positions. Do not redraw, reframe, stylize, relight or replace the scene. No new lanterns, no new lettering, no watermark. This is object removal only.
