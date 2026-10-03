/* ==========================================================
   教材內容資料（繁體中文／English）
   來源：線性規劃教材 PDF（第 1 章 線性規劃，p.6–23）
   標示「教學補充」者為本網站額外加入的說明，非教材原文。
   ========================================================== */
(function (global) {
  'use strict';
  const T = (zh, en) => ({ zh, en });

  /* ---------------- 線性規劃情境預設（實驗室 & 圖形用） ---------------- */
  const PRESETS = {
    text: {
      name: T('教材引例：x+2y≥6, x−y≤2, y≤4', 'Textbook demo: x+2y≥6, x−y≤2, y≤4'),
      cons: [{ a: 1, b: 2, c: 6, op: '>=' }, { a: 1, b: -1, c: 2, op: '<=' }, { a: 0, b: 1, c: 4, op: '<=' }],
      obj: { p: 1, q: 1 }, goal: 'max', view: { xmin: -4, xmax: 8, ymin: -2, ymax: 7 },
      vars: T('x、y 為實數', 'x, y are real numbers')
    },
    ex4: {
      name: T('例題 4：x+2y≤6, 2x+y≤6, x≥0, y≥0', 'Example 4: x+2y≤6, 2x+y≤6, x≥0, y≥0'),
      cons: [{ a: 1, b: 2, c: 6, op: '<=' }, { a: 2, b: 1, c: 6, op: '<=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: 1, q: 3 }, goal: 'max', view: { xmin: -1, xmax: 7, ymin: -1, ymax: 7 },
      vars: T('目標函數 x+3y', 'objective x+3y')
    },
    ex5: {
      name: T('例題 5：提煉精油（最大值）', 'Example 5: refining essential oil (max)'),
      cons: [{ a: 5, b: 4, c: 80, op: '<=' }, { a: 3, b: 1, c: 30, op: '<=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: 25, q: 12 }, goal: 'max', view: { xmin: -1, xmax: 18, ymin: -1, ymax: 32 },
      vars: T('x：原料 A（公噸）；y：原料 B（公噸）', 'x: tons of material A; y: tons of material B')
    },
    ex6: {
      name: T('例題 6：兩工廠合金（成本最小）', 'Example 6: alloy from two factories (min cost)'),
      cons: [{ a: 1, b: 2, c: 8, op: '>=' }, { a: 2, b: 1, c: 10, op: '>=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: 60000, q: 40000 }, goal: 'min', view: { xmin: -1, xmax: 12, ymin: -1, ymax: 12 },
      vars: T('x：甲工廠（百公克）；y：乙工廠（百公克）', 'x: factory Jia (100 g); y: factory Yi (100 g)')
    },
    t4: {
      name: T('隨堂練習 4：x+y≥10, x−y≤0, y≤10', 'Practice 4: x+y≥10, x−y≤0, y≤10'),
      cons: [{ a: 1, b: 1, c: 10, op: '>=' }, { a: 1, b: -1, c: 0, op: '<=' }, { a: 0, b: 1, c: 10, op: '<=' }],
      obj: { p: 2, q: 1 }, goal: 'max', view: { xmin: -2, xmax: 14, ymin: -2, ymax: 14 },
      vars: T('目標函數 2x+y', 'objective 2x+y')
    },
    t5: {
      name: T('隨堂練習 5：大禹鍛冶工廠（利潤最大）', 'Practice 5: Dayu forge (max profit)'),
      cons: [{ a: 5, b: 2, c: 90, op: '<=' }, { a: 1, b: 1, c: 30, op: '<=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: 50, q: 30 }, goal: 'max', view: { xmin: -2, xmax: 34, ymin: -2, ymax: 34 },
      vars: T('x：A 合金（公斤）；y：B 合金（公斤）', 'x: kg of alloy A; y: kg of alloy B')
    },
    t6: {
      name: T('隨堂練習 6：工廠運轉天數（成本最小）', 'Practice 6: factory days (min cost)'),
      cons: [{ a: 2, b: 1, c: 8, op: '>=' }, { a: 2, b: 7, c: 20, op: '>=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: 10000, q: 20000 }, goal: 'min', view: { xmin: -1, xmax: 12, ymin: -1, ymax: 10 },
      vars: T('x：甲工廠天數；y：乙工廠天數', 'x: days of factory Jia; y: days of factory Yi')
    },
    h5: {
      name: T('習題 5：3x+2y≤6 的整數解', 'Exercise 5: lattice points of 3x+2y≤6'),
      cons: [{ a: 3, b: 2, c: 6, op: '<=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: 1, q: 1 }, goal: 'max', view: { xmin: -1, xmax: 4, ymin: -1, ymax: 4 }, lattice: true,
      vars: T('x、y 為整數', 'x, y are integers')
    },
    h8: {
      name: T('習題 8：貨倉運輸（運費最少）', 'Exercise 8: warehouse shipping (min cost)'),
      cons: [{ a: 1, b: 1, c: 50, op: '<=' }, { a: 1, b: 1, c: 30, op: '>=' }, { a: 1, b: 0, c: 40, op: '<=' }, { a: 0, b: 1, c: 50, op: '<=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: -150, q: -100, r: 61000 }, goal: 'min', view: { xmin: -4, xmax: 56, ymin: -4, ymax: 56 },
      vars: T('x：甲→A 公噸；y：甲→B 公噸', 'x: tons Jia→A; y: tons Jia→B')
    },
    h9: {
      name: T('習題 9：三角形區域，多重最佳解', 'Exercise 9: triangle, multiple optima'),
      cons: [{ a: 2, b: -1, c: 7, op: '<=' }, { a: 1, b: -1, c: -14, op: '>=' }, { a: 4, b: 3, c: 19, op: '>=' }],
      obj: { p: 1, q: -0.5 }, goal: 'max', view: { xmin: -6, xmax: 24, ymin: -3, ymax: 38 },
      vars: T('目標函數 x+ky，k=−1/2', 'objective x+ky with k=−1/2')
    },
    h10: {
      name: T('習題 10：雞場飼料（成本最小）', 'Exercise 10: chicken feed (min cost)'),
      cons: [{ a: 7, b: 2, c: 84, op: '>=' }, { a: 3, b: 6, c: 72, op: '>=' }, { a: 3, b: 2, c: 60, op: '>=' }, { a: 1, b: 0, c: 0, op: '>=' }, { a: 0, b: 1, c: 0, op: '>=' }],
      obj: { p: 5, q: 4 }, goal: 'min', view: { xmin: -2, xmax: 28, ymin: -2, ymax: 46 },
      vars: T('x：第一種飼料（公斤）；y：第二種飼料（公斤）', 'x: kg of feed 1; y: kg of feed 2')
    },
    intro: {
      name: T('章首問題：學期成績最多幾分？', 'Chapter opener: max semester grade'),
      cons: [{ a: 1, b: 0, c: 0, op: '>=' }, { a: 1, b: 0, c: 100, op: '<=' }, { a: 0, b: 1, c: 0, op: '>=' }, { a: 0, b: 1, c: 100, op: '<=' }, { a: 1, b: 1, c: 150, op: '<=' }],
      obj: { p: 0.3, q: 0.7 }, goal: 'max', view: { xmin: -10, xmax: 160, ymin: -10, ymax: 160 },
      vars: T('x：平時成績；y：段考成績', 'x: daily score; y: exam score')
    }
  };

  /* ---------------- 情境模擬器（生產規劃） ---------------- */
  const SCENES = [
    {
      id: 't5', title: T('⚒️ 大禹鍛冶工廠（隨堂練習 5）', '⚒️ Dayu Forge (Practice 5)'),
      story: T('A 合金每公斤用紅色礦砂 50 g、黃色礦砂 40 g，利潤 50 元；B 合金每公斤用紅色礦砂 20 g、黃色礦砂 40 g，利潤 30 元。庫存：紅色礦砂 900 g、黃色礦砂 1200 g。',
        'Alloy A uses 50 g red ore + 40 g yellow ore per kg (profit $50); alloy B uses 20 g red + 40 g yellow per kg (profit $30). Stock: 900 g red, 1200 g yellow.'),
      x: T('A 合金（公斤）', 'Alloy A (kg)'), y: T('B 合金（公斤）', 'Alloy B (kg)'), xmax: 30, ymax: 30, step: 1,
      res: [{ n: T('紅色礦砂 (g)', 'Red ore (g)'), a: 50, b: 20, c: 900, op: '<=' }, { n: T('黃色礦砂 (g)', 'Yellow ore (g)'), a: 40, b: 40, c: 1200, op: '<=' }],
      obj: { p: 50, q: 30 }, goal: 'max', unit: T('利潤（元）', 'Profit ($)'), preset: 't5'
    },
    {
      id: 'ex5', title: T('🧪 提煉精油（例題 5）', '🧪 Essential Oil (Example 5)'),
      story: T('原料 A 每公噸：精油 25 kg、廢棄物 75 kg、成本 15 萬元；原料 B 每公噸：精油 12 kg、廢棄物 25 kg、成本 12 萬元。成本 ≤ 240 萬元、廢棄物 ≤ 750 kg。',
        'Per ton — material A: 25 kg oil, 75 kg waste, cost 150k; material B: 12 kg oil, 25 kg waste, cost 120k. Cost ≤ 2.4M, waste ≤ 750 kg.'),
      x: T('原料 A（公噸）', 'Material A (t)'), y: T('原料 B（公噸）', 'Material B (t)'), xmax: 16, ymax: 20, step: 0.5,
      res: [{ n: T('成本（萬元）', 'Cost (10k)'), a: 15, b: 12, c: 240, op: '<=' }, { n: T('廢棄物（公斤）', 'Waste (kg)'), a: 75, b: 25, c: 750, op: '<=' }],
      obj: { p: 25, q: 12 }, goal: 'max', unit: T('精油（公斤）', 'Oil (kg)'), preset: 'ex5'
    },
    {
      id: 'h10', title: T('🐔 雞場飼料（習題 10）', '🐔 Chicken Feed (Exercise 10)'),
      story: T('第一種飼料每公斤 5 元，含營養素 A 7、B 3、C 3 單位；第二種飼料每公斤 4 元，含 A 2、B 6、C 2 單位。每天至少需 A 84、B 72、C 60 單位。',
        'Feed 1: $5/kg with 7 A, 3 B, 3 C units; Feed 2: $4/kg with 2 A, 6 B, 2 C units. Daily need: at least 84 A, 72 B, 60 C.'),
      x: T('第一種飼料（公斤）', 'Feed 1 (kg)'), y: T('第二種飼料（公斤）', 'Feed 2 (kg)'), xmax: 28, ymax: 44, step: 1,
      res: [{ n: T('營養素 A', 'Nutrient A'), a: 7, b: 2, c: 84, op: '>=' }, { n: T('營養素 B', 'Nutrient B'), a: 3, b: 6, c: 72, op: '>=' }, { n: T('營養素 C', 'Nutrient C'), a: 3, b: 2, c: 60, op: '>=' }],
      obj: { p: 5, q: 4 }, goal: 'min', unit: T('飼料成本（元）', 'Feed cost ($)'), preset: 'h10'
    }
  ];

  /* ---------------- 課程內容 ---------------- */
  const LESSONS = [
    {
      id: 'l0', icon: '🎯', title: T('章首：為什麼要學線性規劃？', 'Opener: why linear programming?'),
      html: T(`
<p class="src">生活上及科技上的許多實際問題，常常是需要在某些限制條件之下求某個量的最大值或最小值。這也是數學的重要應用之一。本章的線性規劃，就是要處理這一類問題，能夠在一些特殊的情況下求出最佳解。線性規劃在經濟學、商業、管理、作業研究等領域中都有大量的應用，如物流路線設計、商品庫存等問題，都可以用線性規劃來描述並求解。</p>
<h3>📌 章首情境：學期成績最多幾分？</h3>
<p>數學老師計算學期成績的方法是平時成績（$x$）占 30％，段考成績（$y$）占 70％。已知小毅平時成績加上段考成績（$x+y$）不超過 150 分，那麼學期成績最多可能有幾分？</p>
<div class="tablewrap"><table class="t"><tr><th></th><th>平時成績（30％）</th><th>段考成績（70％）</th><th>學期成績</th></tr>
<tr><td>小如</td><td>⋯</td><td>⋯</td><td>⋯</td></tr><tr><td>小偉</td><td>⋯</td><td>⋯</td><td>⋯</td></tr><tr><td>小毅</td><td>$x$</td><td>$y$</td><td>？</td></tr></table></div>
<p>在這個例子中，我們在 $0 ≤ x ≤ 100$，$0 ≤ y ≤ 100$，$x+y ≤ 150$ 的條件下求 $0.3x+0.7y$ 的最大值，正是本章要介紹的「線性規劃」的例子。</p>
<p>本章一開始先複習<b>平行直線</b>、<b>二元一次不等式</b>等相關概念，再介紹<b>線性規劃</b>。</p>
<div class="aid" data-label="💡 教學補充">想知道小毅最多拿幾分嗎？到「🧪 互動實驗室 → 線性規劃實驗室」選擇「章首問題」，拖動目標函數直線就能找到答案（在頂點 $(50, 100)$ 時學期成績最多 85 分）。</div>`,
        `
<p class="src">Many real-world problems ask for the maximum or minimum of a quantity under certain constraints. Linear programming (LP) handles exactly this kind of problem and finds the optimal solution. LP is widely used in economics, business, management and operations research — e.g. logistics routing and inventory planning.</p>
<h3>📌 Opening scenario: what is the highest semester grade?</h3>
<p>The semester grade = 30% daily score ($x$) + 70% exam score ($y$). Xiao-Yi’s daily score plus exam score ($x+y$) is at most 150. What is the highest possible semester grade?</p>
<p>We want the maximum of $0.3x+0.7y$ subject to $0 ≤ x ≤ 100$, $0 ≤ y ≤ 100$, $x+y ≤ 150$ — a typical linear programming problem.</p>
<p>This chapter first reviews <b>parallel lines</b> and <b>linear inequalities in two variables</b>, then introduces <b>linear programming</b>.</p>
<div class="aid" data-label="💡 Teaching aid">Open “🧪 Labs → LP Lab”, choose “Chapter opener”, and sweep the objective line: the best grade is 85 at vertex $(50, 100)$.</div>`),
      figs: [{ id: 'intro', cap: T('章首問題的可行解區域', 'Feasible region of the opener') }],
      check: { q: T('章首問題中，要求最大值的「目標」是哪一個式子？', 'In the opener, which expression is to be maximized?'), opts: ['0.3x+0.7y', 'x+y', '0.7x+0.3y', 'x+y≤150'], a: 0, why: T('平時占 30％、段考占 70％，學期成績為 0.3x+0.7y；x+y≤150 是限制條件。', 'Grade = 0.3x+0.7y; x+y≤150 is a constraint.') }
    },
    {
      id: 'l1', icon: '📏', title: T('1 平行直線系', '1 Families of parallel lines'),
      html: T(`
<p class="src">在第一冊中曾經介紹過兩平行直線的斜率相等，反之，斜率相等的兩相異直線必平行。第一冊中也介紹過直線平移只會改變直線的位置，不會改變斜率。因此，將一直線平移後可得到一系列互相平行的直線，這些直線稱為<b>平行直線系</b>。</p>
<p>從例題 1 中，我們知道直線 $x−y=0$、$x−y=1$、$x−y=2$、$x−y=3$ 這些直線都是互相平行的。</p>
<div class="key">因為直線 $L：ax+by+c=0$（$b≠0$）的斜率為 $−\\frac{a}{b}$，所以如果<b>維持 $x$、$y$ 的係數不變，只改變常數項</b>，如此可得一系列斜率相等、位置不同的直線，稱為<b>平行直線系</b>。</div>
<p>如圖 5，$L_1：x+y−1=0$，$L_2：x+y−2=0$，$L_3：x+y−3=0$，⋯，$L_n：x+y−n=0$ 即構成一個平行直線系。直線 $L_1$ 往上方平行移動得到 $L_2$，$L_3$，⋯，$L_n$，其 $x$ 截距會愈來愈大，$y$ 截距也會愈來愈大，<b>截距的變化跟常數項的改變有直接的關係</b>。</p>
<div class="aid" data-label="💡 教學補充：平移公式">把直線 $ax+by=c$ <b>向右平移 $h$ 單位</b>：以 $x−h$ 代替 $x$，得 $a(x−h)+by=c$，即 $ax+by=c+ah$。<br>把直線 <b>向上平移 $k$ 單位</b>：以 $y−k$ 代替 $y$，得 $ax+b(y−k)=c$，即 $ax+by=c+bk$。<br>→ 平移只改變常數項，係數 $a$、$b$（也就是斜率）不變！</div>`,
        `
<p class="src">Two parallel lines have equal slopes; conversely, two distinct lines with equal slopes are parallel. Translating a line changes only its position, not its slope. Translating a line repeatedly gives a set of mutually parallel lines — a <b>family of parallel lines</b>.</p>
<p>From Example 1, the lines $x−y=0$, $x−y=1$, $x−y=2$, $x−y=3$ are all parallel.</p>
<div class="key">The line $L: ax+by+c=0$ ($b≠0$) has slope $−\\frac{a}{b}$. <b>Keeping the coefficients of $x$ and $y$ and changing only the constant term</b> gives lines with equal slope but different positions: a family of parallel lines.</div>
<p>In Fig. 5, $L_1: x+y−1=0$, $L_2: x+y−2=0$, …, $L_n: x+y−n=0$ form a family. Moving $L_1$ upward gives $L_2, L_3, …$; both intercepts grow — <b>the intercepts change directly with the constant term</b>.</p>
<div class="aid" data-label="💡 Teaching aid: translation rules">Shift $ax+by=c$ <b>right by $h$</b>: replace $x$ by $x−h$ → $ax+by=c+ah$.<br>Shift <b>up by $k$</b>: replace $y$ by $y−k$ → $ax+by=c+bk$.<br>Only the constant term changes; the slope stays the same.</div>`),
      figs: [{ id: 'f1', cap: T('例題 1：x−y=0 向右平移 1、2、3 單位', 'Ex. 1: x−y=0 shifted right 1, 2, 3') }, { id: 'f5', cap: T('圖 5：平行直線系 x+y−n=0', 'Fig. 5: family x+y−n=0') }],
      check: { q: T('下列哪一條直線與 2x+3y=1 平行？', 'Which line is parallel to 2x+3y=1?'), opts: ['2x+3y=7', '3x+2y=1', '2x−3y=1', '4x+3y=2'], a: 0, why: T('只改變常數項，係數不變 → 斜率同為 −2/3。', 'Only the constant changes → same slope −2/3.') }
    },
    {
      id: 'l2', icon: '🌗', title: T('2 二元一次不等式', '2 Linear inequalities in two variables'),
      html: T(`
<p class="src">在第一冊中我們已經介紹過二元一次不等式及其圖形。例如：$x+y=2$ 的圖形是直線 $L$，$x+y>2$ 的圖形是半平面 $E_1$，$x+y<2$ 的圖形是半平面 $E_2$。</p>
<p>如果將半平面 $E_1$ 與直線 $L$ 合起來，就是 $x+y≥2$ 的圖形；將半平面 $E_2$ 與直線 $L$ 合起來，就是 $x+y≤2$ 的圖形。</p>
<div class="key">當不等式<b>含等號</b>時，圖形就包含界線 $L$，此時直線 $L$ 以<b>實線</b>表示；當不等式<b>不含等號</b>時，圖形就不包含界線 $L$，此時直線 $L$ 以<b>虛線</b>表示。</div>
<h3>🔍 怎麼決定取哪一個半平面？</h3>
<p>以 $x+y<2$ 為例，先畫出 $x+y=2$ 的直線，然後任取一點（通常取原點 $O(0, 0)$），發現 $0+0<2$，意思是 $(0, 0)$ 在 $x+y<2$ 的半平面上。也就是說，包含 $(0, 0)$ 的那個半平面就是 $x+y<2$ 的圖形。若直線通過原點，則可取點 $(1, 0)$ 或 $(0, 1)$ 來驗算。</p>
<h3>🧩 聯立不等式</h3>
<p>二元一次聯立不等式的圖形，就是各個不等式圖形的<b>共同部分</b>（例題 3）。</p>
<div class="aid" data-label="💡 教學補充：口訣">「先畫線（含等號畫實線、不含畫虛線）→ 代一點（原點優先）→ 成立取同側、不成立取另一側 → 聯立取交集」。</div>`,
        `
<p class="src">For example, the graph of $x+y=2$ is a line $L$; $x+y>2$ is the half-plane $E_1$; $x+y<2$ is the half-plane $E_2$.</p>
<p>$E_1$ together with $L$ is the graph of $x+y≥2$; $E_2$ with $L$ is $x+y≤2$.</p>
<div class="key">If the inequality <b>includes equality</b>, the boundary $L$ belongs to the graph and is drawn <b>solid</b>; otherwise it is drawn <b>dashed</b>.</div>
<h3>🔍 Which half-plane?</h3>
<p>For $x+y<2$: draw $x+y=2$, then test a point (usually the origin). Since $0+0<2$, the half-plane containing $(0,0)$ is the graph. If the line passes through the origin, test $(1,0)$ or $(0,1)$.</p>
<h3>🧩 Systems of inequalities</h3>
<p>The graph of a system is the <b>common part (intersection)</b> of the individual graphs (Example 3).</p>
<div class="aid" data-label="💡 Teaching aid">Draw the line (solid/dashed) → test a point → keep that side if true, the other side if false → intersect for a system.</div>`),
      figs: [{ id: 'f7a', cap: T('圖 7a：x+y=2', 'Fig 7a: x+y=2') }, { id: 'f7b', cap: T('圖 7b：x+y＞2（E₁）', 'Fig 7b: x+y>2 (E₁)') }, { id: 'f7c', cap: T('圖 7c：x+y＜2（E₂）', 'Fig 7c: x+y<2 (E₂)') },
        { id: 'f8a', cap: T('圖 8a：x+y≥2（實線）', 'Fig 8a: x+y≥2 (solid)') }, { id: 'f8b', cap: T('圖 8b：x+y≤2（實線）', 'Fig 8b: x+y≤2 (solid)') }, { id: 'f8c', cap: T('圖 8c：x+y＜2（虛線）', 'Fig 8c: x+y<2 (dashed)') }],
      check: { q: T('不等式 x+y＜2 的界線 x+y=2 應該畫成？', 'The boundary of x+y<2 should be drawn as?'), opts: [T('虛線，且圖形含原點', 'dashed, region contains origin'), T('實線，且圖形含原點', 'solid, region contains origin'), T('虛線，且圖形不含原點', 'dashed, region excludes origin'), T('實線，且圖形不含原點', 'solid, region excludes origin')], a: 0, why: T('不含等號 → 虛線；代原點 0+0＜2 成立 → 取含原點的一側。', 'No equality → dashed; 0+0<2 true → origin side.') }
    },
    {
      id: 'l3', icon: '🎯', title: T('3 線性規劃：可行解與目標函數', '3 LP: feasible solutions & objective'),
      html: T(`
<p class="src">許多日常生活中所產生的現實問題都和二元一次聯立不等式有關。例如商人在有限資源限制下，尋找資源最佳分配的生產方法，以獲得最大利潤的問題。如何找出一組符合限制條件的最佳解是本章所要討論的重點。</p>
<p>我們先來看一個例子：已知實數數對 $(x, y)$ 滿足 $x+2y≥6$，$x−y≤2$，$y≤4$，那麼，要如何求 $x+y$ 的最大值或最小值呢？</p>
<div class="key">
<b>可行解</b>：滿足聯立不等式的數對 $(x, y)$。<br>
<b>可行解區域</b>：所有可行解在平面上所形成的區域（如圖 14 中 △ABC 內部及邊界）。<br>
<b>目標函數</b>：要求最大值或最小值的式子，例如 $x+y$。<br>
<b>最佳解</b>：產生最大值或最小值的點 $(x, y)$。</div>
<p>當目標函數的值為某一常數 $k$ 時，即 $x+y=k$，這是一條斜率為 $−1$ 的直線，且其 $x$ 截距為 $k$。因此，當這一條直線平行移動時，<b>愈往右上方，$k$ 值愈大；愈往左下方，$k$ 值愈小</b>。</p>
<p>當直線 $x+y=k$ 通過可行解區域時，此直線上的所有可行解均使 $x+y$ 的值為 $k$，例如：直線 $x+y=7$ 上的可行解，均使 $x+y$ 的值為 7。直線 $x+y=10$ 通過可行解區域最右上方的 $C(6, 4)$，而當 $k>10$ 時，直線 $x+y=k$ 不再通過可行解區域，故目標函數 $x+y$ 的<b>最大值為 10</b>。同理，直線 $x+y=2$ 通過可行解區域最左上方的 $A(−2, 4)$，而當 $k<2$ 時，直線不再通過可行解區域，故 $x+y$ 的<b>最小值為 2</b>。</p>
<p>▶ 拖動下面的滑桿，親自移動 $x+y=k$：</p>
<div class="lessonSweep"></div>`,
        `
<p class="src">Many real problems involve systems of linear inequalities, e.g. allocating limited resources to maximize profit. Finding an optimal solution satisfying all constraints is the focus of this chapter.</p>
<p>Example: real pairs $(x, y)$ satisfy $x+2y≥6$, $x−y≤2$, $y≤4$. How do we find the max/min of $x+y$?</p>
<div class="key">
<b>Feasible solution</b>: a pair $(x, y)$ satisfying the system.<br>
<b>Feasible region</b>: the set of all feasible solutions (△ABC with its boundary in Fig. 14).<br>
<b>Objective function</b>: the expression to maximize/minimize, e.g. $x+y$.<br>
<b>Optimal solution</b>: the point giving the max or min.</div>
<p>Setting $x+y=k$ gives a line of slope $−1$ with $x$-intercept $k$. Moving it <b>up-right increases $k$; down-left decreases $k$</b>.</p>
<p>The line $x+y=10$ touches the region at its top-right vertex $C(6,4)$; for $k>10$ it misses the region, so the <b>maximum is 10</b>. Likewise $x+y=2$ touches $A(−2,4)$, so the <b>minimum is 2</b>.</p>
<p>▶ Drag the slider to move $x+y=k$:</p>
<div class="lessonSweep"></div>`),
      figs: [{ id: 'f14', cap: T('圖 14：可行解區域 △ABC', 'Fig. 14: feasible region △ABC') }],
      check: { q: T('在 x+2y≥6, x−y≤2, y≤4 的條件下，x+y 的最大值為？', 'Under x+2y≥6, x−y≤2, y≤4, the max of x+y is?'), opts: ['10', '7', '2', '12'], a: 0, why: T('直線 x+y=k 最後通過 C(6, 4)，k=10。', 'The last contact point is C(6,4): k=10.') }
    },
    {
      id: 'l4', icon: '🛠️', title: T('4 解題方法：平行線法與頂點法', '4 Methods: parallel-line & vertex'),
      html: T(`
<p class="src">本章的目標函數均為一次函數（線型函數），且可行解區域的邊界均為直線，解決這類問題的方法稱為<b>線性規劃</b>。</p>
<div class="steps">
<div class="step"><b>設變數</b>適當地假設變數 $x$、$y$。</div>
<div class="step"><b>列限制條件</b>依限制條件列出聯立不等式。</div>
<div class="step"><b>畫可行解區域</b>在坐標平面上畫出可行解區域。</div>
<div class="step"><b>求最佳解</b>由目標函數產生的平行直線系（平行線法）或代入頂點（頂點法）求出最佳解。</div>
</div>
<h3>📐 平行線法</h3>
<p>令目標函數 $=k$，得到一組平行直線系，將直線平行移動掃過可行解區域，最後（或最先）碰到可行解區域的位置即為最佳解。</p>
<h3>🔺 頂點法</h3>
<p class="src">如果可行解區域的邊界均為直線，且目標函數為一次函數的話，這類的線性規劃問題所求之極值，<b>若存在則必在可行解區域的頂點（或邊界）出現</b>。這裡的頂點指的是落在可行解區域，並為至少兩條邊界直線的交點。由於邊界上必有頂點，所以只要將所有頂點代入目標函數，即可求出極值，稱為<b>頂點法</b>。</p>
<p>例如，在例題 4 中，可行解區域的頂點為 $(0, 0)$，$(3, 0)$，$(2, 2)$，$(0, 3)$，將它們分別代入目標函數 $x+3y$：</p>
<div class="tablewrap"><table class="t"><tr><th>$(x, y)$</th><td>$(0, 0)$</td><td>$(3, 0)$</td><td>$(2, 2)$</td><td>$(0, 3)$</td></tr><tr><th>$x+3y$</th><td>0</td><td>3</td><td>8</td><td>9</td></tr></table></div>
<p>由表 1 知例題 4 的最大值為 9，最小值為 0。同學們可試著比較與平行線法求解的異同，解題時兩種方法可搭配使用。</p>
<div class="aid" data-label="💡 教學補充：兩種方法比較">
<div class="tablewrap"><table class="t"><tr><th></th><th>平行線法</th><th>頂點法</th></tr>
<tr><td>做法</td><td>移動目標函數直線 $px+qy=k$</td><td>求出所有頂點並代入比較</td></tr>
<tr><td>優點</td><td>直觀；可判斷區域無界時極值是否存在</td><td>計算機械化、不易看錯</td></tr>
<tr><td>注意</td><td>斜率接近時需小心比較</td><td>可行解區域無界時，需先確認極值存在</td></tr></table></div></div>
<h3>📜 歷史小故事</h3>
<p class="src">線性規劃最早起源於 1920～1930 年代，由坎拓羅維奇（Leonid Kantorovich，1912～1986）及李安鐵夫（Wassily Leontief，1905～1999）等人所提出的研究方式演化而成。雖然發展並不算早，但現在已經發展得很成熟了。輔以電腦強大的計算能力，線性規劃方法已經廣泛應用在經濟學及相關領域上，獲得極大的成功。</p>`,
        `
<p class="src">Here objective functions are linear and the feasible region is bounded by lines; solving such problems is called <b>linear programming</b>.</p>
<div class="steps">
<div class="step"><b>Define variables</b>Choose suitable variables $x$, $y$.</div>
<div class="step"><b>Write constraints</b>Express the conditions as a system of inequalities.</div>
<div class="step"><b>Draw the feasible region</b>Graph it on the coordinate plane.</div>
<div class="step"><b>Find the optimum</b>Use the family of objective lines (parallel-line method) or check the vertices (vertex method).</div>
</div>
<h3>📐 Parallel-line method</h3>
<p>Set the objective equal to $k$, giving a family of parallel lines; slide the line across the region — the last (or first) contact gives the optimum.</p>
<h3>🔺 Vertex method</h3>
<p class="src">If the region is bounded by lines and the objective is linear, the extreme value, <b>if it exists, occurs at a vertex (or along an edge)</b>. A vertex is a point of the region where at least two boundary lines meet. Substitute all vertices into the objective and compare.</p>
<p>In Example 4 the vertices are $(0,0)$, $(3,0)$, $(2,2)$, $(0,3)$; values of $x+3y$: 0, 3, 8, 9 → max 9, min 0.</p>
<div class="aid" data-label="💡 Teaching aid">Parallel-line: intuitive; shows whether an optimum exists for unbounded regions. Vertex: mechanical and reliable; check existence first if the region is unbounded.</div>
<h3>📜 A bit of history</h3>
<p class="src">LP originated in the 1920s–30s from work by Leonid Kantorovich (1912–1986) and Wassily Leontief (1905–1999). Together with computers it is now widely and successfully used in economics and related fields.</p>`),
      figs: [{ id: 'f16', cap: T('例題 4：可行解區域與 x+3y=k', 'Example 4: region and x+3y=k') }],
      check: { q: T('線性規劃的極值若存在，必出現在可行解區域的哪裡？', 'If an LP optimum exists, where must it occur?'), opts: [T('頂點（或邊界）', 'at a vertex (or edge)'), T('區域的正中心', 'at the centre'), T('原點', 'at the origin'), T('任意內部點', 'any interior point')], a: 0, why: T('一次目標函數的極值必出現在頂點或邊界。', 'Linear objectives attain extremes at vertices/edges.') }
    }
  ];

  /* ---------------- 例題、隨堂練習、習題 ---------------- */
  // kind: ex 例題 / try 隨堂練習 / hw 習題 ; check: {type:'num', inputs:[{label, ans}]} | {type:'mc', opts, a}
  const ITEMS = [
    { id: 'ex1', kind: 'ex', no: '1', tag: T('平行直線系', 'Parallel lines'),
      q: T('設 $L_0$ 的方程式為 $x−y=0$，將直線 $L_0$ 分別向右平移 1 單位、2 單位、3 單位，得直線 $L_1$、$L_2$、$L_3$，試在坐標平面上畫出直線 $L_1$，$L_2$，$L_3$，並求其方程式。',
        'Let $L_0: x−y=0$. Shift $L_0$ right by 1, 2, 3 units to get $L_1, L_2, L_3$. Draw them and find their equations.'),
      steps: [T('如圖 3 所示，直線 $L_0$ 為過原點 $O(0, 0)$ 且斜率為 1 的直線。將直線 $L_0$ 分別向右平移 1、2、3 單位，得直線 $L_1$、$L_2$、$L_3$。', '$L_0$ passes through $O(0,0)$ with slope 1; shift it right by 1, 2, 3.'),
        T('直線 $L_1$ 為過點 $(1, 0)$ 且斜率為 1 的直線，其方程式為 $x−y=1$。', '$L_1$ passes $(1,0)$ with slope 1: $x−y=1$.'),
        T('直線 $L_2$ 為過點 $(2, 0)$ 且斜率為 1 的直線，其方程式為 $x−y=2$。', '$L_2$: through $(2,0)$: $x−y=2$.'),
        T('直線 $L_3$ 為過點 $(3, 0)$ 且斜率為 1 的直線，其方程式為 $x−y=3$。', '$L_3$: through $(3,0)$: $x−y=3$.')],
      fig: 'f1' },
    { id: 'try1', kind: 'try', no: '1', tag: T('平行直線系', 'Parallel lines'),
      q: T('承例題 1，將直線 $L_0$ 分別向左平移 1 單位、2 單位、3 單位，得直線 $L_4$、$L_5$、$L_6$，試在坐標平面上畫出直線 $L_4$，$L_5$，$L_6$，並求其方程式。',
        'Continuing Ex. 1, shift $L_0$ left by 1, 2, 3 units to get $L_4, L_5, L_6$. Draw them and find their equations.'),
      steps: [T('向左平移 1 單位，直線通過 $(−1, 0)$，斜率仍為 1。', 'Shifted left 1: passes $(−1,0)$, slope 1.'),
        T('$L_4：x−y=−1$，$L_5：x−y=−2$，$L_6：x−y=−3$。', '$L_4: x−y=−1$, $L_5: x−y=−2$, $L_6: x−y=−3$.')],
      check: { type: 'num', inputs: [{ label: T('L₄：x−y =', 'L₄: x−y ='), ans: -1 }, { label: T('L₅：x−y =', 'L₅: x−y ='), ans: -2 }, { label: T('L₆：x−y =', 'L₆: x−y ='), ans: -3 }] },
      fig: 'try1', qfig: 'f1base' },
    { id: 'ex2', kind: 'ex', no: '2', tag: T('截距比較', 'Intercepts'),
      q: T('已知坐標平面上有三直線 $L_1：2x+y=2$，$L_2：2x+y=4$，$L_3：2x+y=6$。設直線 $L_1$、$L_2$、$L_3$ 與 $x$ 軸的交點分別為 $(a_1, 0)$、$(a_2, 0)$、$(a_3, 0)$，試比較 $a_1$，$a_2$，$a_3$ 的大小關係。',
        'Lines $L_1: 2x+y=2$, $L_2: 2x+y=4$, $L_3: 2x+y=6$ meet the $x$-axis at $(a_1,0)$, $(a_2,0)$, $(a_3,0)$. Compare $a_1, a_2, a_3$.'),
      steps: [T('如圖 6 所示，直線 $L_1$ 與 $x$ 軸交點為 $(1, 0)$，所以得 $a_1=1$。', '$L_1$ meets the x-axis at $(1,0)$: $a_1=1$.'),
        T('直線 $L_2$ 與 $x$ 軸交點為 $(2, 0)$，所以得 $a_2=2$；直線 $L_3$ 與 $x$ 軸交點為 $(3, 0)$，所以得 $a_3=3$。', '$a_2=2$, $a_3=3$.'),
        T('因此得 $a_1<a_2<a_3$。', 'Hence $a_1<a_2<a_3$.')],
      fig: 'f6' },
    { id: 'try2', kind: 'try', no: '2', tag: T('截距比較', 'Intercepts'),
      q: T('承例題 2，設直線 $L_1$、$L_2$、$L_3$ 與 $y$ 軸的交點分別為 $(0, b_1)$、$(0, b_2)$、$(0, b_3)$，試比較 $b_1$，$b_2$，$b_3$ 的大小關係。',
        'Continuing Ex. 2, the lines meet the $y$-axis at $(0,b_1)$, $(0,b_2)$, $(0,b_3)$. Compare them.'),
      steps: [T('令 $x=0$：$L_1$ 得 $y=2$，$L_2$ 得 $y=4$，$L_3$ 得 $y=6$。', 'Set $x=0$: $y=2, 4, 6$.'), T('所以 $b_1=2$，$b_2=4$，$b_3=6$，故 $b_1<b_2<b_3$。', 'So $b_1<b_2<b_3$.')],
      check: { type: 'mc', opts: ['b₁ < b₂ < b₃', 'b₁ > b₂ > b₃', 'b₁ = b₂ = b₃', 'b₂ < b₁ < b₃'], a: 0 }, fig: 'f6' },
    { id: 'ex3', kind: 'ex', no: '3', tag: T('不等式圖形', 'Inequality graphs'),
      q: T('試在坐標平面上，畫出下列不等式的圖形。⑴ 二元一次不等式 $x−2y+2≤0$。⑵ 二元一次聯立不等式 $x−2y+2≤0$，$x+y+2>0$。',
        'Graph ⑴ $x−2y+2≤0$; ⑵ the system $x−2y+2≤0$, $x+y+2>0$.'),
      steps: [T('⑴ 先畫出直線 $L_1：x−2y+2=0$，將原點 $O(0, 0)$ 代入 $x−2y+2$ 得 $0−0+2=2>0$。故不等式 $x−2y+2≤0$ 的圖形為<b>不含原點</b>的半平面與 $L_1$（圖 9）。', '⑴ Draw $L_1: x−2y+2=0$. Origin gives $2>0$, so the graph is the half-plane <b>not containing</b> the origin, plus $L_1$.'),
        T('⑵ 再畫直線 $L_2：x+y+2=0$，將原點代入 $x+y+2$ 得 $2>0$，故 $x+y+2>0$ 的圖形為<b>含原點</b>的半平面（$L_2$ 畫虛線，圖 10）。', '⑵ Draw $L_2: x+y+2=0$ (dashed). Origin gives $2>0$, so take the side <b>containing</b> the origin.'),
        T('兩圖形的<b>共同部分</b>，即為聯立不等式的圖形（圖 11 紅色部分）。', 'The <b>intersection</b> is the graph of the system.')],
      fig: 'f11' },
    { id: 'try3', kind: 'try', no: '3', tag: T('不等式圖形', 'Inequality graphs'),
      q: T('⑴ 試畫出二元一次不等式 $2x−y−2≤0$ 的圖形。⑵ 試畫出二元一次聯立不等式 $2x−y−2≤0$，$x+3y−3>0$ 的圖形。',
        '⑴ Graph $2x−y−2≤0$. ⑵ Graph the system $2x−y−2≤0$, $x+3y−3>0$.'),
      steps: [T('⑴ 畫直線 $2x−y−2=0$（過 $(1, 0)$、$(0, −2)$，實線）。原點代入得 $−2≤0$ 成立 → 取<b>含原點</b>的一側。', '⑴ Line through $(1,0)$, $(0,−2)$ (solid). Origin: $−2≤0$ true → origin side.'),
        T('⑵ 畫直線 $x+3y−3=0$（過 $(3, 0)$、$(0, 1)$，虛線）。原點代入得 $−3>0$ 不成立 → 取<b>不含原點</b>的一側。', '⑵ Line through $(3,0)$, $(0,1)$ (dashed). Origin: $−3>0$ false → other side.'),
        T('兩者共同部分即為所求（右圖紅色區域）。', 'The intersection is the answer.')],
      fig: 'try3', aid: true },
    { id: 'ex4', kind: 'ex', no: '4', tag: T('平行線法', 'Parallel-line'),
      q: T('在 $x+2y≤6$，$2x+y≤6$，$x≥0$，$y≥0$ 的可行解區域中，試求目標函數 $x+3y$ 的最大值及最小值。',
        'On the region $x+2y≤6$, $2x+y≤6$, $x≥0$, $y≥0$, find the max and min of $x+3y$.'),
      steps: [T('先依題意畫出可行解區域的圖形，如圖 16，頂點為 $O(0,0)$、$A(3, 0)$、$B(2, 2)$、$C(0, 3)$。', 'Draw the region; vertices $O(0,0)$, $A(3,0)$, $B(2,2)$, $C(0,3)$.'),
        T('將直線 $x+3y=0$ 平行移動通過上述可行解區域（圖 17）。', 'Slide the line $x+3y=0$ across the region.'),
        T('由這些直線平行移動的方式，可知目標函數 $x+3y$ 在點 $C(0, 3)$ 有最大值，在點 $O(0, 0)$ 有最小值，故<b>最大值為 9，最小值為 0</b>。', 'Max at $C(0,3)$: <b>9</b>; min at $O$: <b>0</b>.')],
      fig: 'f16', lab: 'ex4' },
    { id: 'try4', kind: 'try', no: '4', tag: T('平行線法', 'Parallel-line'),
      q: T('在 $x+y≥10$，$x−y≤0$，$y≤10$ 的可行解區域中，試求目標函數 $2x+y$ 的最大值及最小值。',
        'On $x+y≥10$, $x−y≤0$, $y≤10$, find the max and min of $2x+y$.'),
      steps: [T('畫出可行解區域，為三角形，頂點為 $(5, 5)$、$(10, 10)$、$(0, 10)$。', 'The region is a triangle with vertices $(5,5)$, $(10,10)$, $(0,10)$.'),
        T('代入 $2x+y$：$(5,5)→15$，$(10,10)→30$，$(0,10)→10$。', 'Values: 15, 30, 10.'),
        T('故最大值為 30（在 $(10, 10)$），最小值為 10（在 $(0, 10)$）。', 'Max 30 at $(10,10)$; min 10 at $(0,10)$.')],
      check: { type: 'num', inputs: [{ label: T('最大值', 'Max'), ans: 30 }, { label: T('最小值', 'Min'), ans: 10 }] }, fig: 't4', lab: 't4' },
    { id: 'ex5', kind: 'ex', no: '5', tag: T('應用：最大值', 'Application: max'),
      q: T('用一公噸原料 A 和一公噸原料 B 分別可提煉精油 25 公斤和 12 公斤。但生產過程中會產生廢棄物，每公噸原料 A 和原料 B 分別會產生 75 公斤和 25 公斤的廢棄物。已知原料 A 和原料 B 每公噸的成本分別為 15 萬元和 12 萬元，今若希望成本不超過 240 萬元，而廢棄物不超過 750 公斤，試問最多可提煉多少公斤的精油？',
        'One ton of material A / B yields 25 kg / 12 kg of essential oil and 75 kg / 25 kg of waste, costing 150k / 120k per ton. With cost ≤ 2.4 million and waste ≤ 750 kg, what is the maximum amount of oil?'),
      steps: [T('假設原料 A 有 $x$ 公噸和原料 B 有 $y$ 公噸，由題意列式得 $15x+12y≤240$，$75x+25y≤750$，$x≥0$，$y≥0$，即 $5x+4y≤80$，$3x+y≤30$，$x≥0$，$y≥0$。', 'Let $x$, $y$ be tons of A, B: $15x+12y≤240$, $75x+25y≤750$, i.e. $5x+4y≤80$, $3x+y≤30$, $x,y≥0$.'),
        T('繪出可行解區域如圖 20，其中 $(\\frac{40}{7}, \\frac{90}{7})$ 為直線 $5x+4y=80$ 與 $3x+y=30$ 的交點。', 'The region (Fig. 20) has the corner $(\\frac{40}{7}, \\frac{90}{7})$ where $5x+4y=80$ meets $3x+y=30$.'),
        T('目標函數 $P=25x+12y$。當 $P$ 為任一常數 $k$ 時，$k=25x+12y$ 均為斜率 $−\\frac{25}{12}$ 的直線。', 'Objective $P=25x+12y$; level lines have slope $−\\frac{25}{12}$.'),
        T('將斜率為 $−\\frac{25}{12}$ 的直線逐漸向右上方平移，最後通過可行解區域中的點為 $(\\frac{40}{7}, \\frac{90}{7})$，此時 $25·\\frac{40}{7}+12·\\frac{90}{7}=\\frac{2080}{7}$。', 'Sliding up-right, the last point is $(\\frac{40}{7}, \\frac{90}{7})$, giving $\\frac{2080}{7}$.'),
        T('最多可提煉 $\\frac{2080}{7}$（≈ 297.14）公斤的精油。', 'Maximum oil: $\\frac{2080}{7}$ ≈ 297.14 kg.')],
      fig: 'f20', lab: 'ex5' },
    { id: 'try5', kind: 'try', no: '5', tag: T('應用：最大值', 'Application: max'),
      q: T('大禹鍛冶工廠使用礦砂為主要原料，生產兩種成分不同的合金，其中 A 合金每公斤使用紅色礦砂 50 公克、黃色礦砂 40 公克；B 合金每公斤使用紅色礦砂 20 公克、黃色礦砂 40 公克。已知每售出一公斤的 A 合金，工廠可賺 50 元；每售出一公斤的 B 合金，工廠可賺 30 元。現在工廠進了 900 公克的紅色礦砂及 1200 公克的黃色礦砂。若將這些礦砂用來生產這兩種合金，試問售出成品後工廠最多可賺多少元？',
        'Alloy A uses 50 g red + 40 g yellow ore per kg (profit $50/kg); alloy B uses 20 g red + 40 g yellow per kg (profit $30/kg). With 900 g red and 1200 g yellow ore, what is the maximum profit?'),
      steps: [T('設生產 A 合金 $x$ 公斤、B 合金 $y$ 公斤：$50x+20y≤900$，$40x+40y≤1200$，$x≥0$，$y≥0$，即 $5x+2y≤90$，$x+y≤30$。', 'Let $x$, $y$ kg: $5x+2y≤90$, $x+y≤30$, $x,y≥0$.'),
        T('目標函數 $P=50x+30y$。頂點：$(0,0)$、$(18,0)$、$(10,20)$、$(0,30)$。', 'Objective $P=50x+30y$; vertices $(0,0)$, $(18,0)$, $(10,20)$, $(0,30)$.'),
        T('代入：0、900、1100、900，故最多可賺 <b>1100 元</b>（A 合金 10 公斤、B 合金 20 公斤）。', 'Values 0, 900, 1100, 900 → max <b>$1100</b> at $(10,20)$.')],
      check: { type: 'num', inputs: [{ label: T('最多可賺（元）', 'Max profit'), ans: 1100 }] }, fig: 't5', lab: 't5' },
    { id: 'ex6', kind: 'ex', no: '6', tag: T('應用：最小值', 'Application: min'),
      q: T('某公司有兩工廠，生產成分相同但比例不同的合金。甲工廠生產的合金中，每百公克中含 A 金屬 2 公克、B 金屬 6 公克，其成本為 60000 元。乙工廠生產的合金中，每百公克中含 A 金屬 4 公克、B 金屬 3 公克，其成本為 40000 元。今有一訂單要求該公司提供合金，其中的 A 金屬、B 金屬至少各含 16、30 公克，試問甲、乙兩工廠需各生產多少百公克的合金，才能達成需求並使成本最低？',
        'Factory Jia’s alloy has 2 g metal A and 6 g metal B per 100 g (cost 60000); factory Yi’s has 4 g A and 3 g B per 100 g (cost 40000). An order needs at least 16 g A and 30 g B. How much should each factory produce to minimise cost?'),
      steps: [T('設甲工廠生產合金 $x$ 百公克，乙工廠生產合金 $y$ 百公克：$2x+4y≥16$，$6x+3y≥30$，$x≥0$，$y≥0$，即 $x+2y≥8$，$2x+y≥10$。', 'Let $x$, $y$ (100 g units): $x+2y≥8$, $2x+y≥10$, $x,y≥0$.'),
        T('畫出可行解區域（圖 21）。目標函數 $P=60000x+40000y$，以目標函數產生的平行線掃過可行解區域，可知本題所求的最小值存在。', 'Objective $P=60000x+40000y$; sweeping shows the minimum exists (the region is unbounded).'),
        T('頂點：$(0,10)→400000$；$(4,2)→320000$；$(8,0)→480000$。', 'Vertices: $(0,10)→400000$; $(4,2)→320000$; $(8,0)→480000$.'),
        T('故甲工廠生產 4 百公克、乙工廠生產 2 百公克，成本最低為 <b>320000 元</b>。', 'Jia 400 g, Yi 200 g; minimum cost <b>320000</b>.')],
      fig: 'f21', lab: 'ex6' },
    { id: 'try6', kind: 'try', no: '6', tag: T('應用：最小值', 'Application: min'),
      q: T('有甲、乙兩工廠生產 A、B 兩種不同產品，甲工廠每天可生產 A、B 各 4、2 公噸，乙工廠每天可生產 A、B 各 2、7 公噸，今有一訂單需求 A、B 各 16、20 公噸，假設甲工廠運轉一天成本 10000 元，乙工廠運轉一天成本 20000 元，試問甲、乙兩工廠各運轉幾天會使得成本最低並達成需求？',
        'Factory Jia makes 4 t of A and 2 t of B per day; factory Yi makes 2 t of A and 7 t of B per day. An order needs 16 t of A and 20 t of B. Daily costs are 10000 and 20000. How many days should each run to minimise cost?'),
      steps: [T('設甲運轉 $x$ 天、乙運轉 $y$ 天：$4x+2y≥16$，$2x+7y≥20$，$x≥0$，$y≥0$，即 $2x+y≥8$，$2x+7y≥20$。', 'Let $x$, $y$ days: $2x+y≥8$, $2x+7y≥20$, $x,y≥0$.'),
        T('目標函數 $P=10000x+20000y$。頂點：$(0,8)→160000$；$(3,2)→70000$；$(10,0)→100000$。', 'Vertices: $(0,8)→160000$; $(3,2)→70000$; $(10,0)→100000$.'),
        T('故甲運轉 3 天、乙運轉 2 天，成本最低 70000 元。', 'Jia 3 days, Yi 2 days; min cost 70000.')],
      check: { type: 'num', inputs: [{ label: T('甲（天）', 'Jia (days)'), ans: 3 }, { label: T('乙（天）', 'Yi (days)'), ans: 2 }, { label: T('最低成本', 'Min cost'), ans: 70000 }] }, fig: 't6', lab: 't6' },

    { id: 'hw1', kind: 'hw', no: '1', level: T('基本題', 'Basic'), tag: T('不等式圖形', 'Inequality graphs'),
      q: T('在坐標平面上畫出二元一次聯立不等式 $3x+2y−12≤0$，$x+y−2>0$ 的圖形。', 'Graph the system $3x+2y−12≤0$, $x+y−2>0$.'),
      steps: [T('$3x+2y=12$ 過 $(4,0)$、$(0,6)$，畫實線；原點代入 $−12≤0$ 成立 → 取含原點一側。', '$3x+2y=12$ through $(4,0)$, $(0,6)$, solid; origin true → origin side.'),
        T('$x+y=2$ 過 $(2,0)$、$(0,2)$，畫虛線；原點代入 $−2>0$ 不成立 → 取不含原點一側。', '$x+y=2$ dashed; origin false → other side.'),
        T('兩者共同部分即為所求。', 'Take the intersection.')], fig: 'hw1', aid: true },
    { id: 'hw2', kind: 'hw', no: '2', level: T('基本題', 'Basic'), tag: T('由圖列式', 'From graph'),
      q: T('若二元一次聯立不等式的解集合如圖紅色區域所示（實線過 $(3, 2)$、$(6, 0)$；虛線過 $(0, 1)$、$(3, 2)$），試寫出此聯立不等式。', 'The solution set is the red region (solid line through $(3,2)$, $(6,0)$; dashed line through $(0,1)$, $(3,2)$). Write the system.'),
      steps: [T('實線過 $(3,2)$、$(6,0)$：斜率 $−\\frac{2}{3}$，方程式 $2x+3y=12$；紅色區域含原點，$0≤12$ → $2x+3y−12≤0$。', 'Solid line: $2x+3y=12$; region contains origin → $2x+3y−12≤0$.'),
        T('虛線過 $(0,1)$、$(3,2)$：斜率 $\\frac{1}{3}$，方程式 $x−3y+3=0$；紅色區域含原點且邊界為虛線 → $x−3y+3>0$。', 'Dashed line: $x−3y+3=0$; origin side, strict → $x−3y+3>0$.'),
        T('所求為 $2x+3y−12≤0$，$x−3y+3>0$。', 'Answer: $2x+3y−12≤0$, $x−3y+3>0$.')], fig: 'hw2', qfig: 'hw2', aid: true },
    { id: 'hw3', kind: 'hw', no: '3', level: T('基本題', 'Basic'), tag: T('平移', 'Translation'),
      q: T('已知直線 $L_1：2x−y=1$，$L_2：2x−y=3$。⑴ 若 $L_1$ 向右平移 $k$ 單位可得 $L_2$，則 $k$ 值為何？⑵ 若 $L_2$ 向上平移 $h$ 單位可得 $L_1$，則 $h$ 值為何？',
        '$L_1: 2x−y=1$, $L_2: 2x−y=3$. ⑴ Shifting $L_1$ right by $k$ gives $L_2$; find $k$. ⑵ Shifting $L_2$ up by $h$ gives $L_1$; find $h$.'),
      steps: [T('⑴ $L_1$ 向右平移 $k$：$2(x−k)−y=1$，即 $2x−y=1+2k$。令 $1+2k=3$ → $k=1$。', '⑴ $2(x−k)−y=1$ → $2x−y=1+2k=3$ → $k=1$.'),
        T('⑵ $L_2$ 向上平移 $h$：$2x−(y−h)=3$，即 $2x−y=3−h$。令 $3−h=1$ → $h=2$。', '⑵ $2x−(y−h)=3$ → $2x−y=3−h=1$ → $h=2$.')],
      check: { type: 'num', inputs: [{ label: 'k =', ans: 1 }, { label: 'h =', ans: 2 }] }, aid: true },
    { id: 'hw4', kind: 'hw', no: '4', level: T('基本題', 'Basic'), tag: T('目標值比較', 'Compare values'),
      q: T('右圖為 $A$，$B$，$C$，$D$ 四點及直線 $L：x−2y=0$，試問 $A$，$B$，$C$，$D$ 四個點坐標 $(x, y)$ 分別代入 $x−2y=k$，哪一點所得 $k$ 值最大？',
        'Points $A, B, C, D$ and line $L: x−2y=0$ are shown. Substituting each point into $x−2y=k$, which point gives the largest $k$?'),
      steps: [T('$x−2y=k$ 是斜率 $\\frac{1}{2}$ 的平行直線系；$x$ 截距為 $k$，直線<b>愈往右下方</b>，$k$ 值愈大。', 'Lines $x−2y=k$ have slope $\\frac12$; $k$ = x-intercept, so moving <b>down-right</b> increases $k$.'),
        T('四點中 $D$ 位於最右下方（$x$ 大、$y$ 小），故 <b>$D$</b> 所得 $k$ 值最大。', '$D$ is furthest down-right → <b>$D$</b>.')],
      check: { type: 'mc', opts: ['A', 'B', 'C', 'D'], a: 3 }, qfig: 'hw4', aid: true },
    { id: 'hw5', kind: 'hw', no: '5', level: T('基本題', 'Basic'), tag: T('整數解', 'Integer points'),
      q: T('已知 $x$，$y$ 為整數，試求滿足二元一次聯立不等式 $3x+2y≤6$，$x≥0$，$y≥0$ 的 $(x, y)$ 共有幾組？', 'If $x, y$ are integers, how many pairs satisfy $3x+2y≤6$, $x≥0$, $y≥0$?'),
      steps: [T('$x=0$：$2y≤6$，$y=0,1,2,3$（4 組）。', '$x=0$: $y=0..3$ (4).'), T('$x=1$：$2y≤3$，$y=0,1$（2 組）。', '$x=1$: $y=0,1$ (2).'), T('$x=2$：$2y≤0$，$y=0$（1 組）。共 <b>7 組</b>。', '$x=2$: $y=0$ (1). Total <b>7</b>.')],
      check: { type: 'num', inputs: [{ label: T('共幾組', 'Number of pairs'), ans: 7 }] }, fig: 'h5', lab: 'h5', aid: true },
    { id: 'hw6', kind: 'hw', no: '6', level: T('進階題', 'Advanced'), tag: T('平行直線系', 'Parallel lines'),
      q: T('假設 $L_1：ax+by=c_1$、$L_2：ax+by=c_2$、$L_3：ax+by=c_3$（如圖，三線斜率為正，由左而右依序為 $L_3$、$L_2$、$L_1$），若 $a<0$，試回答：⑴ $b$ 是正數或負數？⑵ $c_1$，$c_2$，$c_3$ 的大小關係為何？',
        '$L_i: ax+by=c_i$ (positive slopes; from left to right $L_3, L_2, L_1$) with $a<0$. ⑴ Is $b$ positive or negative? ⑵ Order $c_1, c_2, c_3$.'),
      steps: [T('⑴ 斜率 $−\\frac{a}{b}>0$ 且 $a<0$ → $b>0$，<b>$b$ 為正數</b>。', '⑴ Slope $−\\frac ab>0$, $a<0$ ⇒ <b>$b>0$</b>.'),
        T('⑵ $x$ 截距為 $\\frac{c}{a}$；由圖 $\\frac{c_3}{a}<\\frac{c_2}{a}<\\frac{c_1}{a}$，同乘 $a<0$ 不等號反向 → <b>$c_1<c_2<c_3$</b>。', '⑵ x-intercepts $\\frac{c_3}{a}<\\frac{c_2}{a}<\\frac{c_1}{a}$; multiply by $a<0$ → <b>$c_1<c_2<c_3$</b>.')],
      check: { type: 'mc', opts: ['c₁ < c₂ < c₃', 'c₁ > c₂ > c₃', 'c₂ < c₁ < c₃', 'c₁ = c₂ = c₃'], a: 0 }, qfig: 'hw6', aid: true },
    { id: 'hw7', kind: 'hw', no: '7', level: T('進階題', 'Advanced'), tag: T('目標值比較', 'Compare values'),
      q: T('右圖為正六邊形 $ABCDEF$（$A$、$B$ 在 $x$ 軸上且對稱於 $y$ 軸），若直線 $L$ 的方程式為 $3x−2y−k=0$，試問直線 $L$ 通過哪一個頂點時，可使 $k$ 值最大？',
        'Regular hexagon $ABCDEF$ ($A$, $B$ on the x-axis, symmetric about the y-axis). For $L: 3x−2y−k=0$, through which vertex is $k$ largest?'),
      steps: [T('設邊長為 $s$，則 $A(−\\frac{s}{2}, 0)$、$B(\\frac{s}{2}, 0)$、$C(s, \\frac{\\sqrt3}{2}s)$、$D(\\frac{s}{2}, \\sqrt3 s)$⋯', 'With side $s$: $B(\\frac s2,0)$, $C(s,\\frac{\\sqrt3}{2}s)$, …'),
        T('$k=3x−2y$：$B$ 得 $1.5s$；$C$ 得 $(3−\\sqrt3)s≈1.27s$；其餘頂點更小。', '$k=3x−2y$: $B→1.5s$, $C→(3−\\sqrt3)s≈1.27s$; others smaller.'),
        T('故通過 <b>$B$</b> 時 $k$ 值最大。（直線斜率 $\\frac32$ 比 $BC$ 的斜率 $\\sqrt3$ 小，往右下移動最後碰到 $B$。）', 'So <b>$B$</b>.')],
      check: { type: 'mc', opts: ['A', 'B', 'C', 'D', 'E', 'F'], a: 1 }, qfig: 'hw7', aid: true },
    { id: 'hw8', kind: 'hw', no: '8', level: T('進階題', 'Advanced'), tag: T('運輸問題', 'Transportation'),
      q: T('某進出口公司有甲、乙兩貨倉，儲存某原料各 50 公噸、60 公噸。該公司接到 A、B 兩工廠分別訂購該原料 40 公噸、50 公噸，若每公噸運費為：甲→A 500 元、甲→B 600 元、乙→A 650 元、乙→B 700 元，則應自各貨倉運多少原料至各工廠才能使得運費最少？此時的運費為多少元？',
        'Warehouses Jia/Yi store 50 t / 60 t. Factories A/B order 40 t / 50 t. Cost per ton: Jia→A 500, Jia→B 600, Yi→A 650, Yi→B 700. How should it be shipped to minimise cost, and what is the cost?'),
      steps: [T('設甲運往 A、B 各 $x$、$y$ 公噸，則乙運往 A、B 各 $(40−x)$、$(50−y)$ 公噸。', 'Let Jia send $x$ to A and $y$ to B; Yi sends $40−x$ and $50−y$.'),
        T('限制：$x+y≤50$，$(40−x)+(50−y)≤60$ 即 $x+y≥30$，$0≤x≤40$，$0≤y≤50$。', 'Constraints: $x+y≤50$, $x+y≥30$, $0≤x≤40$, $0≤y≤50$.'),
        T('運費 $=500x+600y+650(40−x)+700(50−y)=61000−150x−100y$。', 'Cost $=61000−150x−100y$.'),
        T('頂點：$(30,0)→56500$，$(40,0)→55000$，$(40,10)→54000$，$(0,50)→56000$，$(0,30)→58000$。', 'Vertices: 56500, 55000, 54000, 56000, 58000.'),
        T('最少運費 <b>54000 元</b>：甲→A 40 公噸、甲→B 10 公噸、乙→A 0 公噸、乙→B 40 公噸。', 'Min <b>54000</b>: Jia→A 40, Jia→B 10, Yi→A 0, Yi→B 40.')],
      check: { type: 'num', inputs: [{ label: T('最少運費（元）', 'Min cost'), ans: 54000 }] }, fig: 'h8', lab: 'h8', aid: true },
    { id: 'hw9', kind: 'hw', no: '9', level: T('進階題', 'Advanced'), tag: T('多重最佳解', 'Multiple optima'),
      q: T('如右圖，$\\overleftrightarrow{AB}：2x−y−7=0$、$\\overleftrightarrow{BC}：x−y+14=0$、$\\overleftrightarrow{CA}：4x+3y=19$，設可行解區域為 $A$，$B$，$C$ 三點所圍成的三角形區域及邊界，目標函數為 $x+ky$，且在 $(5, 3)$ 與 $(7, 7)$ 有最大值，則 $k$ 值為何？',
        'Lines $AB: 2x−y−7=0$, $BC: x−y+14=0$, $CA: 4x+3y=19$ bound triangle $ABC$. The objective $x+ky$ attains its maximum at both $(5,3)$ and $(7,7)$. Find $k$.'),
      steps: [T('$(5,3)$ 與 $(7,7)$ 都在直線 $AB$ 上（代入 $2x−y−7=0$ 皆成立）。', 'Both points lie on $AB$.'),
        T('在兩點同時有最大值 → 兩點目標值相等：$5+3k=7+7k$ → $k=−\\frac{1}{2}$。', 'Equal values: $5+3k=7+7k$ → $k=−\\frac12$.'),
        T('此時目標函數直線 $x−\\frac{1}{2}y=M$ 與 $AB$ 平行（斜率 2），整段邊 $AB$ 都是最佳解。', 'Then the objective line is parallel to $AB$; every point of edge $AB$ is optimal.')],
      check: { type: 'num', inputs: [{ label: 'k =', ans: -0.5 }] }, fig: 'h9', lab: 'h9', aid: true },
    { id: 'hw10', kind: 'hw', no: '10', level: T('素養題', 'Literacy'), tag: T('飼料配方', 'Feed mix'),
      q: T('為預防禽流感，營養師吩咐雞場主人每天必須從飼料中提供至少 84 單位的營養素 A、至少 72 單位的營養素 B 和至少 60 單位的營養素 C 給他的雞群。第一種飼料每公斤售價 5 元並含有 7 單位 A、3 單位 B 與 3 單位 C；第二種飼料每公斤售價 4 元並含有 2 單位 A、6 單位 B 與 2 單位 C。每天使用 $x$ 公斤第一種與 $y$ 公斤第二種飼料。⑴ 除 $x≥0$，$y≥0$ 外，寫下 $x$，$y$ 須滿足的聯立不等式。⑵ 以最少成本達成營養要求，目標函數為何？⑶ 最少的飼料成本是多少元？',
        'Chickens need at least 84 units of A, 72 of B, 60 of C daily. Feed 1 ($5/kg) has 7 A, 3 B, 3 C; feed 2 ($4/kg) has 2 A, 6 B, 2 C. Use $x$ kg and $y$ kg. ⑴ Write the constraints. ⑵ Objective? ⑶ Minimum cost?'),
      steps: [T('⑴ $7x+2y≥84$，$3x+6y≥72$（即 $x+2y≥24$），$3x+2y≥60$。', '⑴ $7x+2y≥84$, $3x+6y≥72$ ($x+2y≥24$), $3x+2y≥60$.'),
        T('⑵ 目標函數 $P=5x+4y$（求最小值）。', '⑵ Minimise $P=5x+4y$.'),
        T('⑶ 頂點：$(0,42)→168$，$(6,21)→114$，$(18,3)→102$，$(24,0)→120$。最少成本 <b>102 元</b>（$x=18$，$y=3$）。', '⑶ Vertices give 168, 114, 102, 120 → min <b>$102</b> at $(18,3)$.')],
      check: { type: 'num', inputs: [{ label: T('最少成本（元）', 'Min cost'), ans: 102 }] }, fig: 'h10', lab: 'h10', aid: true }
  ];

  /* ---------------- 測驗題庫 ---------------- */
  const QUIZ = [
    { q: T('直線 2x+3y=1 與下列哪一條直線平行？', 'Which line is parallel to 2x+3y=1?'), opts: ['2x+3y=7', '3x+2y=1', '2x−3y=1', '4x+3y=2'], a: 0, why: T('平行直線系：係數不變、只改常數項。', 'Same coefficients, different constant.') },
    { q: T('直線 x−y=0 向右平移 2 單位後的方程式為？', 'Shift x−y=0 right by 2. The new line is?'), opts: ['x−y=2', 'x−y=−2', 'x+y=2', 'x−y=0'], a: 0, why: T('以 x−2 代 x：(x−2)−y=0 → x−y=2。', 'Replace x by x−2: x−y=2.') },
    { q: T('三直線 2x+y=2, 2x+y=4, 2x+y=6 的 x 截距 a₁, a₂, a₃ 的大小關係為？', 'x-intercepts of 2x+y=2, 4, 6 compare as?'), opts: ['a₁<a₂<a₃', 'a₁>a₂>a₃', 'a₁=a₂=a₃', 'a₂<a₁<a₃'], a: 0, why: T('a₁=1, a₂=2, a₃=3。', 'a₁=1, a₂=2, a₃=3.') },
    { q: T('不等式 x+y≥2 的界線 x+y=2 要畫成？', 'The boundary of x+y≥2 is drawn as?'), opts: [T('實線', 'solid'), T('虛線', 'dashed'), T('不必畫', 'not drawn'), T('粗虛線', 'thick dashed')], a: 0, why: T('含等號 → 圖形包含界線 → 實線。', 'Includes equality → solid.') },
    { q: T('原點 (0,0) 是否在 x−2y+2≤0 的圖形上？', 'Is the origin in the graph of x−2y+2≤0?'), opts: [T('否', 'No'), T('是', 'Yes')], a: 0, why: T('代入得 2≤0 不成立。', '2≤0 is false.') },
    { q: T('下列哪一點在 2x−y−2≤0 的圖形上？', 'Which point satisfies 2x−y−2≤0?'), opts: ['(0, 0)', '(3, 0)', '(2, 1)', '(4, 1)'], a: 0, why: T('(0,0)：−2≤0 成立；其他代入皆 >0。', '(0,0) gives −2≤0; others give positive values.') },
    { q: T('滿足聯立不等式的數對 (x, y) 稱為？', 'A pair (x, y) satisfying the system is called a?'), opts: [T('可行解', 'feasible solution'), T('最佳解', 'optimal solution'), T('目標函數', 'objective'), T('頂點', 'vertex')], a: 0, why: T('教材定義：滿足聯立不等式的數對稱為可行解。', 'Definition from the textbook.') },
    { q: T('目標函數 x+y=k 的直線往右上方平移時，k 值會？', 'Moving x+y=k up-right, k will?'), opts: [T('愈來愈大', 'increase'), T('愈來愈小', 'decrease'), T('不變', 'stay'), T('先大後小', 'rise then fall')], a: 0, why: T('x 截距為 k，往右上方 k 愈大。', 'k is the x-intercept.') },
    { q: T('在 x+2y≤6, 2x+y≤6, x≥0, y≥0 中，x+3y 的最大值為？', 'Max of x+3y on x+2y≤6, 2x+y≤6, x,y≥0?'), num: 9, why: T('頂點 (0,3) 代入得 9。', 'Vertex (0,3) gives 9.') },
    { q: T('可行解區域頂點為 (0,0),(3,0),(2,2),(0,3)，則 2x+y 的最大值為？', 'Vertices (0,0),(3,0),(2,2),(0,3). Max of 2x+y?'), num: 6, why: T('(3,0) 與 (2,2) 都得 6 → 最大值 6，且整段邊都是最佳解（多重最佳解）。', '(3,0) and (2,2) both give 6 — multiple optima.') },
    { q: T('在 x+2y≥6, x−y≤2, y≤4 中，x+y 的最小值為？', 'Min of x+y on x+2y≥6, x−y≤2, y≤4?'), num: 2, why: T('x+y=2 通過 A(−2,4)。', 'Touches A(−2,4): 2.') },
    { q: T('5x+4y=80 與 3x+y=30 的交點為？', 'Intersection of 5x+4y=80 and 3x+y=30?'), opts: ['(40/7, 90/7)', '(6, 12)', '(10, 0)', '(4, 15)'], a: 0, why: T('y=30−3x 代入：5x+120−12x=80 → x=40/7。', 'Substitute y=30−3x → x=40/7.') },
    { q: T('例題 6 中，成本最低時甲、乙工廠各生產多少百公克？', 'Example 6: optimal production (Jia, Yi) in 100 g?'), opts: ['(4, 2)', '(0, 10)', '(8, 0)', '(2, 4)'], a: 0, why: T('代入頂點，(4,2) 成本 320000 最低。', '(4,2) costs 320000, the lowest.') },
    { q: T('線性規劃問題的極值若存在，必出現在？', 'An LP optimum, if it exists, occurs at?'), opts: [T('可行解區域的頂點（或邊界）', 'a vertex (or edge)'), T('區域內部中心', 'the centre'), T('原點', 'the origin'), T('x 軸上', 'the x-axis')], a: 0, why: T('頂點法的依據。', 'Basis of the vertex method.') },
    { q: T('x, y 為整數，滿足 3x+2y≤6, x≥0, y≥0 的 (x,y) 共有幾組？', 'Integer pairs with 3x+2y≤6, x,y≥0?'), num: 7, why: T('4+2+1=7。', '4+2+1=7.') },
    { q: T('L₁：2x−y=1 向右平移 k 單位得 L₂：2x−y=3，k=？', 'Shifting 2x−y=1 right by k gives 2x−y=3. k=?'), num: 1, why: T('2(x−k)−y=1 → 1+2k=3。', '1+2k=3.') },
    { q: T('隨堂練習 5 中，「紅色礦砂」的限制式為？', 'Practice 5: the red-ore constraint is?'), opts: ['50x+20y≤900', '40x+40y≤1200', '50x+30y≤900', '50x+40y≤900'], a: 0, why: T('A 用 50 g、B 用 20 g，共不超過 900 g。', 'A uses 50 g, B 20 g, total ≤ 900.') },
    { q: T('點 (1,1) 是否在 x+y＜2 的圖形上？', 'Is (1,1) in the graph of x+y<2?'), opts: [T('否，它在虛線界線上', 'No, it lies on the dashed boundary'), T('是', 'Yes')], a: 0, why: T('1+1=2 不小於 2，界線不含在內。', '1+1=2 is not < 2.') },
    { q: T('目標函數 P=25x+12y 的等值線斜率為？', 'Level lines of P=25x+12y have slope?'), opts: ['−25/12', '25/12', '−12/25', '12/25'], a: 0, why: T('斜率 −a/b = −25/12。', 'Slope −a/b.') },
    { q: T('若可行解區域無界（向外延伸），則：', 'If the feasible region is unbounded:'), opts: [T('最大值或最小值不一定存在', 'a max or min may not exist'), T('一定有最大值', 'a max always exists'), T('一定沒有最小值', 'no min ever'), T('沒有可行解', 'no feasible point')], a: 0, why: T('如例題 6 有最小值但沒有最大值，需用平行線法判斷。', 'E.g. Example 6 has a min but no max.') },
    { q: T('平行直線系 ax+by+c=0 中，改變的是？', 'In a family ax+by+c=0, what changes?'), opts: [T('常數項 c', 'the constant c'), T('係數 a', 'coefficient a'), T('係數 b', 'coefficient b'), T('斜率', 'the slope')], a: 0, why: T('維持 x、y 係數不變，只改變常數項。', 'Only the constant changes.') },
    { q: T('隨堂練習 6 的最低成本為多少元？', 'Practice 6: minimum cost?'), num: 70000, why: T('頂點 (3,2)：30000+40000=70000。', 'Vertex (3,2).') },
    { q: T('習題 9 中，目標函數 x+ky 在 (5,3) 與 (7,7) 都有最大值，k=？', 'Exercise 9: x+ky is max at (5,3) and (7,7). k=?'), num: -0.5, why: T('5+3k=7+7k → k=−1/2。', '5+3k=7+7k.') },
    { q: T('畫二元一次不等式的圖形時，若界線通過原點（無法用原點判斷），教材建議改用哪個點測試？', 'If the boundary passes through the origin, which point should be tested instead?'), opts: ['(1, 0) 或 (0, 1)', '(0, 0)', T('任意界線上的點', 'any point on the line'), T('不必測試', 'no test')], a: 0, why: T('教材：若直線通過原點，則可取點 (1,0) 或 (0,1) 來驗算。', 'Textbook: use (1,0) or (0,1).') }
  ];

  /* ---------------- 介面文字 ---------------- */
  const UI = {
    zh: {
      title: '線性規劃', subtitle: '互動學習網｜平行直線系・二元一次不等式・線性規劃',
      nav_home: '🏠 學習指引', nav_learn: '📘 課程內容', nav_lab: '🧪 互動實驗室', nav_ex: '📝 範例與習題', nav_adv: '🚀 進階延伸', nav_prac: '🔁 練習', nav_quiz: '🏆 測驗', nav_rec: '📊 學習歷程',
      settings: '⚙️ 顯示與操作設定', set_full: '全螢幕', set_sound: '音效', set_device: '裝置', set_layout: '版面', set_lang: '語言', set_font: '字體', set_theme: '色系',
      on: '開啟', off: '關閉', auto: '自動', mobile: '手機', tablet: '平板', desktop: '電腦', portrait: '直式', landscape: '橫式', small: '縮小', normal: '標準', large: '放大', system: '跟隨系統', light: '亮色', dark: '暗色',
      pdf: '下載原始教材 PDF', close: '關閉', done_read: '✅ 我讀完了', read_ok: '已完成閱讀', check: '檢查答案', show_sol: '👀 看下一步', all_sol: '📖 顯示完整解答', hide_sol: '🙈 收起解答', open_lab: '🧪 在實驗室開啟',
      quick: '⚡ 隨堂小測', correct: '答對了！', wrong: '再想想！', answer: '正確答案', next: '下一題 ➜', start: '開始', retry: '再測一次',
      aid_tag: '參考解答（教學補充）', src_tag: '教材解答', mark_done: '標記完成', marked: '已完成',
      kind_ex: '例題', kind_try: '隨堂練習', kind_hw: '習題', all: '全部'
    },
    en: {
      title: 'Linear Programming', subtitle: 'Interactive learning site · parallel lines · inequalities · LP',
      nav_home: '🏠 Guide', nav_learn: '📘 Lessons', nav_lab: '🧪 Labs', nav_ex: '📝 Examples', nav_adv: '🚀 Advanced', nav_prac: '🔁 Practice', nav_quiz: '🏆 Quiz', nav_rec: '📊 Records',
      settings: '⚙️ Display & control settings', set_full: 'Fullscreen', set_sound: 'Sound', set_device: 'Device', set_layout: 'Layout', set_lang: 'Language', set_font: 'Font size', set_theme: 'Theme',
      on: 'On', off: 'Off', auto: 'Auto', mobile: 'Phone', tablet: 'Tablet', desktop: 'Desktop', portrait: 'Portrait', landscape: 'Landscape', small: 'Smaller', normal: 'Normal', large: 'Larger', system: 'System', light: 'Light', dark: 'Dark',
      pdf: 'Download original PDF', close: 'Close', done_read: '✅ I finished reading', read_ok: 'Read', check: 'Check', show_sol: '👀 Next step', all_sol: '📖 Full solution', hide_sol: '🙈 Hide', open_lab: '🧪 Open in Lab',
      quick: '⚡ Quick check', correct: 'Correct!', wrong: 'Not quite!', answer: 'Answer', next: 'Next ➜', start: 'Start', retry: 'Try again',
      aid_tag: 'Reference solution (teaching aid)', src_tag: 'Textbook solution', mark_done: 'Mark done', marked: 'Done',
      kind_ex: 'Example', kind_try: 'Practice', kind_hw: 'Exercise', all: 'All'
    }
  };

  global.DATA = { T, PRESETS, SCENES, LESSONS, ITEMS, QUIZ, UI };
})(window);
