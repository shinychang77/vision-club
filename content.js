/*
 * ============================================================
 *  content.js — 全站可替換內容（題目、詞條、公告、結果卡、介面文案）
 * ============================================================
 *
 *  換內容只需要改這個檔案。頁面邏輯（js/ 資料夾）不寫死任何題目或文案。
 *  改完直接重新整理瀏覽器即可，不需要建置。改完建議執行一次
 *      node tests/check.js
 *  它會檢查 ID 是否重複、分數欄位是否填錯、線索是否對得上。
 *
 *  ── 標記規則 ──────────────────────────────────────────────
 *  「【佔位】」＝暫時的替身內容，正式上線前要換掉。全域搜尋「【佔位】」就能找到全部。
 *  沒有標記的文字＝可以直接使用（企劃書原句、真實科學內文、一般介面文字）。
 *
 *  ── 寫法注意 ──────────────────────────────────────────────
 *  - 這是一般 JavaScript 物件：字串用 '單引號' 包起來，項目之間用逗號分隔。
 *  - 文字一律當純文字顯示，打 <b> 之類的標籤不會變粗體（防止排版被意外弄壞）。
 *    唯一例外是名稱叫 svg 的欄位，會原樣插入成圖片。
 *  - 文字裡的 {n}、{score} 這種大括號是會被替換的變數，請保留。
 *  - id 只能用英文小寫、數字和連字號，並且全站不可重複。
 *    id 一旦上線就不要再改：玩家的進度是用 id 記錄的，改了舊紀錄會對不上而被丟棄。
 *
 *  ── 各區塊一覽 ────────────────────────────────────────────
 *  quiz              正常測驗題（quiz.html）
 *  anomalyQuestions  異常題：平常不出現，在各網站有了發現、解鎖後才插入測驗（quiz.html）
 *  result            結果頁與分享卡（result.html）
 *  wiki              知識庫／詞條與站內搜尋（wiki.html）
 *  notices           事件發生後才出現在首頁公告欄的公告（index.html）。目前沒有
 *  profile           個人資料頁（profile.html）
 *  forum             論壇（forum.html）
 *  effects           眼疾效果：解鎖後出現的症狀與強度（js/effects.js）
 *  lab               研究單位網站與模擬 SEM（lab/index.html、lab/sem.html）
 *  cult              教團網站（fellowship/index.html）
 */
var EYE_CONTENT = {

  /* ----------------------------------------------------------
   * quiz：正常測驗
   * ----------------------------------------------------------
   * questions 依陣列順序出題。每題欄位：
   *   id       題目代號，例如 'q1'
   *   prompt   題目文字
   *   svg      （選填）題目下方的圖，原樣插入的 SVG 字串（只能放自己寫的內容）
   *   lines    （選填）題目下方用等寬字顯示的幾行文字，例如字母排列。陣列，一個元素一行
   *   options  選項陣列，每個選項：
   *              id     選項代號（同一題內不重複即可），例如 'a'
   *              text   選項文字
   *              score  選這個選項得幾分（答對 1、答錯 0）。理智值＝得分比例 × 100
   *              trait  （選填）作答風格，決定結果類型：
   *                       'intuitive' 直覺　'deliberate' 審慎　'global' 整體　'local' 細節
   *                     每個風格軸（直覺↔審慎、整體↔細節）的題數要是奇數，才不會平手
   *   note     （選填）題目下方的小字補充說明
   *
   * 設計原則：題目借用公開的認知心理學實驗形式（錯覺、錯誤記憶、視覺搜尋等），內容自己出，
   * 不用正式臨床或商業測驗的原題；結果只描述作答風格，不暗示任何疾病或能力高低。
   * 注意：異常題插入後題號會變，題目裡不要寫「第 3 題」這種題號。
   */
  quiz: {
    title: '視界認知小測驗',
    intro: '測驗約 10 題，沒有時間限制，請依照第一個感覺作答',
    // 介面文字。{n}＝目前第幾題，{total}＝總題數
    ui: {
      count: '第 {n} 題／共 {total} 題',
      prev: '上一題',
      next: '下一題',
      toResult: '查看結果',
      toUnanswered: '前往未作答的題目',
      doneTitle: '你已完成全部 {total} 題。',
      doneTitleOpen: '你已完成目前開放的 {n} 題。',
      doneLocked: '本測驗共 {total} 題，還有 {locked} 題尚未對你開放。',
      doneText: '可以查看結果，或回頭檢視、修改作答。',
      review: '檢視作答',
      needProfile: '開始作答前，請先填寫暱稱和年齡。',
      toProfile: '前往填寫',
      // 解鎖異常題時右下角跳的提示（每一頁都會跳，點了到測驗頁，按 ✕ 才會關掉）。{n}＝已解鎖幾題，{total}＝共幾題
      unlockToast: '解鎖新題目 {n}/{total}',
      closeToast: '關閉提示'
    },
    questions: [
      {
        // 繆勒-萊爾錯覺：兩條一樣長，下面那條（箭尾向外）看起來比較長
        id: 'q1',
        prompt: '下面兩條橫線，哪一條比較長？',
        svg: '<svg viewBox="0 0 320 170" role="img" aria-label="上下兩條橫線，上面那條兩端是向外的箭頭，下面那條兩端是向外張開的箭尾">' +
          '<g stroke="#1c2b33" stroke-width="3" stroke-linecap="round" fill="none">' +
          '<path d="M90 50H230M90 50l20-15M90 50l20 15M230 50l-20-15M230 50l-20 15"/>' +
          '<path d="M90 125H230M90 125l-20-15M90 125l-20 15M230 125l20-15M230 125l20 15"/></g>' +
          '<g fill="#5b6b74" font-size="18"><text x="22" y="56">上</text><text x="22" y="131">下</text></g></svg>',
        options: [
          { id: 'a', text: '上面那條', score: 0, trait: 'intuitive' },
          { id: 'b', text: '下面那條', score: 0, trait: 'intuitive' },
          { id: 'c', text: '一樣長', score: 1, trait: 'deliberate' }
        ]
      },
      {
        // 整體／細節（Navon 圖形）：小 S 排成大 H
        id: 'q2',
        prompt: '這個圖形中，你第一眼看到的是哪個字母？',
        lines: [
          'S       S',
          'S       S',
          'S       S',
          'SSSSSSSSS',
          'S       S',
          'S       S',
          'S       S'
        ],
        options: [
          { id: 'a', text: 'H', score: 0, trait: 'global' },
          { id: 'b', text: 'S', score: 0, trait: 'local' }
        ]
      },
      {
        // 錯誤記憶（DRM）的背誦階段：全部和睡眠有關，但刻意不放「睡覺」，第 8 題會問
        id: 'q3',
        prompt: '這些詞大多和什麼有關？',
        lines: [
          '床　　休息　清醒　疲倦　夢',
          '打盹　毯子　瞌睡　打呼　枕頭'
        ],
        options: [
          { id: 'a', text: '睡眠', score: 1 },
          { id: 'b', text: '旅行', score: 0 },
          { id: 'c', text: '烹飪', score: 0 }
        ]
      },
      {
        // 直覺陷阱（認知反射）：直覺答案是 6，正確是 3
        id: 'q4',
        prompt: '一顆蘋果和一顆梨子共 26 元，蘋果比梨子貴 20 元。梨子多少元？',
        options: [
          { id: 'a', text: '3 元', score: 1, trait: 'deliberate' },
          { id: 'b', text: '6 元', score: 0, trait: 'intuitive' },
          { id: 'c', text: '13 元', score: 0, trait: 'intuitive' }
        ]
      },
      {
        // 視覺搜尋：第三排藏著一個 Q
        id: 'q5',
        prompt: '下面四排字母裡，哪一排藏著一個不一樣的字母？',
        lines: [
          'O O O O O O O O O O',
          'O O O O O O O O O O',
          'O O O O O O Q O O O',
          'O O O O O O O O O O'
        ],
        options: [
          { id: 'a', text: '第一排', score: 0 },
          { id: 'b', text: '第二排', score: 0 },
          { id: 'c', text: '第三排', score: 1 },
          { id: 'd', text: '第四排', score: 0 }
        ]
      },
      {
        // 文字閱讀：句中「解了」「境環」「覺直」的字序是反的，問有沒有發現
        id: 'q6',
        prompt: '請用平常的速度讀完下面這句話，再誠實回答',
        lines: [
          '這個測驗是為了解了你在日常境環中的觀察習慣，',
          '請放輕鬆，依照覺直作答。'
        ],
        options: [
          { id: 'a', text: '有發現文字順序不對', score: 0, trait: 'local' },
          { id: 'b', text: '沒發現文字順序不對', score: 0, trait: 'global' }
        ]
      },
      {
        // 變化盲視：第 6 個字母不一樣（d → q）
        id: 'q7',
        prompt: '上下兩排字母只有一個位置不一樣。是第幾個？',
        lines: [
          'b d p q b d p q',
          'b d p q b q p q'
        ],
        options: [
          { id: 'a', text: '第 2 個', score: 0 },
          { id: 'b', text: '第 4 個', score: 0 },
          { id: 'c', text: '第 6 個', score: 1 },
          { id: 'd', text: '第 8 個', score: 0 }
        ]
      },
      {
        // 錯誤記憶的回想階段：清單裡沒有「睡覺」，多數人會記得有
        id: 'q8',
        prompt: '還記得前面的題目中有沒有出現「睡覺」這個詞？',
        options: [
          { id: 'a', text: '有', score: 0, trait: 'intuitive' },
          { id: 'b', text: '沒有', score: 1, trait: 'deliberate' }
        ]
      },
      {
        // 陷阱題：長得像艾賓浩斯錯覺（兩圓其實一樣大），但這裡右邊的圓真的比較大（半徑 20 對 16）。
        // 看過這個錯覺的人會答「一樣大」而答錯
        id: 'q9',
        prompt: '左右兩個深色的圓，哪一個比較大？',
        svg: '<svg viewBox="0 0 330 210" role="img" aria-label="左邊一個深色圓被六個大灰圓包圍，右邊一個深色圓被八個小灰圓包圍">' +
          '<circle cx="151" cy="95" r="28" fill="#9aa7ad"/><circle cx="123" cy="143.5" r="28" fill="#9aa7ad"/>' +
          '<circle cx="67" cy="143.5" r="28" fill="#9aa7ad"/><circle cx="39" cy="95" r="28" fill="#9aa7ad"/>' +
          '<circle cx="67" cy="46.5" r="28" fill="#9aa7ad"/><circle cx="123" cy="46.5" r="28" fill="#9aa7ad"/>' +
          '<circle cx="95" cy="95" r="16" fill="#17606b"/>' +
          '<circle cx="308" cy="95" r="8" fill="#9aa7ad"/><circle cx="298.3" cy="118.3" r="8" fill="#9aa7ad"/>' +
          '<circle cx="275" cy="128" r="8" fill="#9aa7ad"/><circle cx="251.7" cy="118.3" r="8" fill="#9aa7ad"/>' +
          '<circle cx="242" cy="95" r="8" fill="#9aa7ad"/><circle cx="251.7" cy="71.7" r="8" fill="#9aa7ad"/>' +
          '<circle cx="275" cy="62" r="8" fill="#9aa7ad"/><circle cx="298.3" cy="71.7" r="8" fill="#9aa7ad"/>' +
          '<circle cx="275" cy="95" r="20" fill="#17606b"/>' +
          '<g fill="#5b6b74" font-size="18" text-anchor="middle"><text x="95" y="200">左</text><text x="275" y="200">右</text></g></svg>',
        options: [
          { id: 'a', text: '左邊', score: 0 },
          { id: 'b', text: '右邊', score: 1 },
          { id: 'c', text: '一樣大', score: 0 }
        ]
      },
      {
        // 自我描述：整體或細節
        id: 'q10',
        prompt: '看一幅畫的時候，你通常會先注意什麼？',
        options: [
          { id: 'a', text: '整體的氛圍和構圖', score: 0, trait: 'global' },
          { id: 'b', text: '畫面裡某個小細節', score: 0, trait: 'local' }
        ]
      }
    ]
  },

  /* ----------------------------------------------------------
   * anomalyQuestions：異常題
   * ----------------------------------------------------------
   * 平常看不到，解鎖後才會出現在測驗中。
   *   unlockEvent 事件代號：玩家打開對應的文件、或調了某個設定之後解鎖（事件代號見 effects 的說明，另外還有 profile.childAge.event）
   * 題號是固定的（正常題加上全部異常題，照 after 排好），所以還沒解鎖的題目會跳號；
   * 測驗頁和結果頁也會寫「共幾題、還有幾題尚未對你開放」，玩家看得出還缺幾題。
   * 每題欄位：
   *   id          題目代號，例如 'a1'（不可和正常題重複）
   *   after       插在哪一題後面（填正常題的 id）。找不到就排在最後
   *   prompt / note    同正常題
   *   options     選項陣列，每個選項：
   *                 id       選項代號
   *                 text     選項文字
   *                 anomaly  選這個選項加幾分「異常分數」。異常分數是隱藏的，
   *                          不會顯示給玩家，也不會算進認知分數，留給之後的結局判定
   */
  anomalyQuestions: [
    // ---- 以下五題是主線：各由一個發現或設定解鎖。題目和選項都是佔位，anomaly 大於 0 的是「異常的答案」 ----
    {
      id: 'a2',
      unlockEvent: 'eye-diary', // 打開研究員的研究日記（lab.docs 的 diary）。在 SEM 看見眼睛只帶來白內障效果，不解鎖題目
      after: 'q4',
      prompt: '研究■■■■■■■衍生物時，會被[[祂]]發現嗎？', // 七個 ■ 對應 OPHANIM
      options: [
        { id: 'a', text: '不會', anomaly: 0 },
        { id: 'b', text: '會', anomaly: 1 }
      ]
    },
    {
      id: 'a3',
      unlockEvent: 'lab-file', // 解開研究中心那份用點字提示的加密文件
      after: 'q6',
      prompt: '下面兩個色塊，哪一個是紅色？',
      // 左綠右紅，兩個顏色的亮度差不多：有色覺異常效果時幾乎分不出來
      svg: '<svg viewBox="0 0 330 150" role="img" aria-label="左右兩個一樣大的色塊"><rect x="25" y="15" width="120" height="120" rx="10" fill="#6f8a3a"/><rect x="185" y="15" width="120" height="120" rx="10" fill="#b04a3c"/></svg>',
      options: [
        { id: 'a', text: '左邊', anomaly: 0 },
        { id: 'b', text: '右邊', anomaly: 0 },
        { id: 'c', text: '我分不出來', anomaly: 1 }
      ]
    },
    {
      id: 'a4',
      unlockEvent: 'cult-site', // 輸入兩句暗號、進入教團網站
      after: 'q8',
      prompt: '光是必要的嗎？',
      options: [
        { id: 'a', text: '是，生物必須有光', anomaly: 0 },
        { id: 'b', text: '否，光妨礙了我認知世界', anomaly: 1 }
      ]
    },
    {
      id: 'a5',
      unlockEvent: 'cult-file', // 在教團網站用色盲圖的數字打開文件
      after: 'q9',
      prompt: '你想成為使者嗎？',
      options: [
        { id: 'a', text: '想', anomaly: 1 },
        { id: 'b', text: '不想', anomaly: 0 }
      ]
    },
    {
      id: 'a6',
      unlockEvent: 'child-age', // 在個人資料把年齡改成 12 歲以下（profile.childAge）
      after: 'q10',
      prompt: '這幅畫中的事物是真實的嗎？',
      // image：題目附圖（路徑相對於網站根目錄）。作者弟弟的畫，名字已去掉，加了泛黃、雜訊、暗角（後室風格）
      image: { src: 'assets/quiz/child-drawing.jpg', alt: '一張泛黃、有雜訊的兒童畫：一個人的臉一半黃一半藍，五官錯開，身體是長長的紅色條紋，兩隻手是兩團白色。' },
      options: [
        { id: 'a', text: '不是，這只是兒童畫', anomaly: 0 },
        { id: 'b', text: '是，我小時候也看得到', anomaly: 1 }
      ]
    }
  ],

  /* ----------------------------------------------------------
   * result：結果頁與分享卡
   * ----------------------------------------------------------
   * levels      依理智值（得分百分比 0–100）給的理智狀態。由上往下找第一個符合下限的。
   *               minPercent  下限（含）
   *               title       理智狀態名稱（結果卡上顯示的字）
   * types       結果類型，鍵是兩個風格軸的組合（見 quiz 的 trait）。每個類型：
   *               name     類型名稱（結果卡大字顯示）
   *               tagline  一句代表這個類型的台詞（結果卡上顯示成引言）
   *               text     類型說明，大約 50 字以內（結果卡最多顯示三行）
   *               tags     標籤，三個左右，太多放不下的會省略
   *             只描述作答風格，寫成正面或中性的特質，不要寫成能力高低或任何疾病
   * cardFields  結果卡上的欄位，依順序顯示。key 只能用下列其中一個：
   *               nickname   暱稱（個人資料頁填的，沒填用 anonymousName）
   *               score      理智值（換算成 0–100）
   *               type       結果類型名稱
   *               level      理智狀態
   *               ageGroup   參考年齡層（依個人資料的年齡，對照 ageGroups）
   *               date       測驗日期（玩家當天日期）
   *               subjectId  受測編號（每個玩家第一次作答時隨機產生）
   * noise       解鎖任一異常題後，哪個欄位變成雜訊：
   *               field   填 cardFields 裡的某個 key
   *               chars   雜訊從這些字元裡挑
   *               length  雜訊長度
   *             雜訊依受測編號決定，同一個玩家每次看到的都一樣，不同玩家不一樣。
   * ageGroups   年齡層對照，由上往下找第一個 age <= upTo 的
   * shareText   「複製文字」複製出去的內容。可用變數：
   *               {nickname} {score} {type} {tagline} {level} {ageGroup} {date} {subjectId} {url}
   */
  result: {
    title: '測驗結果',
    cardTitle: '視界認知小測驗',
    cardSubtitle: '個人結果',
    anonymousName: '受測者',
    scoreUnit: '／100',   // 接在理智值後面的小字
    typeLead: '你是',       // 類型名稱上方的小字
    cardCta: '你的理智還剩多少？', // 結果卡最下方、網址前面的一句話
    // 年齡未滿 dimBelowAge 歲時，結果卡整張變暗：每小 1 歲暗 dimPerYear（0.05＝5%）。下載的圖也一樣
    dimBelowAge: 12,
    dimPerYear: 0.05,
    levels: [
      { minPercent: 80, title: '視界清晰' },
      { minPercent: 50, title: '偶有雜訊' },
      { minPercent: 0,  title: '訊號不穩' }
    ],
    types: {
      'intuitive-global':  { name: '廣角型', tagline: '何必執著細節', tags: ['#一眼看完', '#氣氛雷達', '#抓重點'], text: '你習慣一眼掌握整個畫面，反應快，抓得住重點。擅長在人多的場合裡察覺氣氛變化！' },
      'intuitive-local':   { name: '快門型', tagline: '你剛剛動了對吧', tags: ['#眼睛很忙', '#找碴冠軍', '#手比腦快'], text: '你能在一瞬間抓住細節，能一眼發覺角落裡的異狀！' },
      'deliberate-global': { name: '全景型', tagline: '我先看完再跟你講', tags: ['#慢慢來', '#大局觀', '#不輕易上當'], text: '你會先停下來，把整個畫面看清楚再下判斷。' },
      'deliberate-local':  { name: '顯微型', tagline: '等一下，我再檢查一遍', tags: ['#放大再放大', '#細節控', '#凡事先懷疑'], text: '你喜歡把東西一處一處精確檢查，重要的是看得精確。' }
    },
    cardFields: [
      { key: 'nickname',  label: '受測者' },
      { key: 'score',     label: '理智值' },
      { key: 'type',      label: '類型' },
      { key: 'level',     label: '理智狀態' },
      { key: 'ageGroup',  label: '參考年齡層' },
      { key: 'date',      label: '測驗日期' },
      { key: 'subjectId', label: '受測編號' }
    ],
    noise: {
      field: 'ageGroup',
      chars: '▓▒░█▚▞▙▟▛▜',
      length: 9
    },
    ageGroups: [
      { upTo: 11,  label: '12 歲以下' },
      { upTo: 17,  label: '12–17 歲' },
      { upTo: 29,  label: '18–29 歲' },
      { upTo: 44,  label: '30–44 歲' },
      { upTo: 64,  label: '45–64 歲' },
      { upTo: 200, label: '65 歲以上' }
    ],
    ageUnknown: '未填寫（使用整體資料）',
    shareUrl: 'https://shinychang77.github.io/vision-club/', // 正式網址（GitHub Pages 試玩版）
    shareText: '我的理智值剩 {score}／100，鑑定為「{type}」：{tagline} 你的理智還剩多少？{url}',
    incompleteText: '你還沒有完成測驗，完成全部題目後才會產生結果。',
    incompleteLink: '繼續作答',
    pendingHint: '還有 {n} 題尚未作答。完成後，結果會更完整。',
    lockedHint: '本測驗共 {total} 題，還有 {n} 題尚未對你開放。',
    pendingLink: '前往作答',
    shareTextLabel: '分享文字',
    // 分享：手機和支援的瀏覽器會叫出系統的分享選單（附上結果卡圖片和文字），不支援的就改成複製文字
    shareButton: '分享',
    copyButton: '複製文字',
    copyDone: '已複製到剪貼簿。',
    copyFail: '無法自動複製，請手動選取上方文字。',
    downloadButton: '下載圖片',
    downloadName: 'horizon-result.png',
    retakeLink: '檢視作答'
  },

  /* ----------------------------------------------------------
   * wiki：知識庫（詞條）
   * ----------------------------------------------------------
   * entries 每個詞條：
   *   id        詞條代號，也是網址：wiki.html#這個id
   *   title     標題
   *   summary   目錄與搜尋結果裡的一行簡介
   *   category  分類（顯示在標題上方）
   *   updated   最後更新日期 'YYYY-MM-DD'
   *   keywords  搜尋關鍵字。搜尋框輸入的內容包含任一關鍵字、
   *             或是標題／關鍵字包含輸入的內容，就會找到這個詞條。
   *             詞條一開始不會列出來：玩家搜尋搜到（或直接開網址）之後才會列出。
   *             有紅字（type 'red'）或清晰度滑桿的是補充詞條，列在中間的「知識庫」（indexTitle）；
   *             其他的（主線的文件、連結、專訪）列在旁邊的「搜尋歷史」（historyTitle），最新的在上面。
   *   href      （選填）填了就不是詞條，而是搜尋得到的連結，點了直接到那個網址（例如論壇入口）。blocks 留空陣列 []
   *   blocks    內文，由上到下排列。每一塊選一種 type：
   *     { type: 'h',   text: '小標題' }
   *     { type: 'p',   text: '一段文字' }
   *     { type: 'red', text: '紅字' }               — 紅色的文字
   *     { type: 'img', src: '圖片路徑', alt: '文字說明', caption: '圖說（選填）' } — 圖片
   *     { type: 'refs', items: ['參考資料一', ...] } — 參考資料列表
   *     { type: 'clarity', ... }                    — 清晰度滑桿機關，欄位：
   *         svg        圖片（SVG 原始碼），或改填 src（圖片檔路徑）
   *         alt        圖片的文字說明（給螢幕閱讀器）
   *         caption    圖說
   *         label      滑桿名稱
   *         maxBlur    清晰度調到 0 時的模糊程度（px）
   *         revealBelow  清晰度低於這個值（0–100）時浮現訊息
   *         revealText   藏在圖裡的字，模糊到門檻以下才浮現（不填就只有模糊）。設定上是 0 號使者寫的，和抄本同一個人：
   *                      用拉丁文、手抄墨水字，s 寫成長 s「ſ」（字尾的 s 照常）。紅字只給 OPHANIM 那條線用
   *         requires   哪個事件發生後滑桿才能用（填事件代號）。之前只有圖，圖說用 lockedCaption
   *         lockedCaption  滑桿還不能用時的圖說
   *
   */
  wiki: {
    title: '知識庫',
    intro: '同好們一起整理的知覺與認知小百科。看到有興趣的詞，用右上角的搜尋查查看。',
    searchResultTitle: '「{q}」的搜尋結果',
    searchEmpty: '找不到符合「{q}」的詞條。請換個關鍵字。',
    historyTitle: '搜尋歷史',
    historyEmpty: '還沒有搜尋紀錄。',
    indexTitle: '知識庫詞條',
    foundEmpty: '還沒有找到任何詞條。試試用站內搜尋輸入關鍵字。',
    notFound: '找不到這個詞條，可能已經移除或更名。',
    backToIndex: '回到已找到的詞條',
    // 詞條頁最下面的編號：這是玩家第幾個找到的詞條／一共幾個詞條（新聞、公告和連結不算），提示還剩幾個沒找到
    foundOrder: '{n}/{total}',
    updatedLabel: '最後更新',
    entries: [
      {
        id: 'pareidolia',
        title: '空想性錯視',
        summary: '在無生命物體或光影中自動看見人臉的知覺現象。',
        category: '知覺心理學',
        updated: '2026-09-15',
        keywords: ['空想性錯視', '幻想性錯視', '空想性錯覺', '錯視', '人臉', '臉孔', 'pareidolia'],
        blocks: [
          { type: 'p', text: '空想性錯視（pareidolia）是指在隨機或模糊的刺激中，知覺到有意義圖像的現象。最常見的例子是大腦在無生命的物體或光影中自動看見人臉，例如電源插座、汽車車頭、房屋外觀或木紋。\n\n人類對臉孔非常敏感。只要畫面中出現「兩個點在上、一個開口在下」這類大致的排列，大腦就傾向把它解讀成一張臉。研究者認為，這種寧可錯認也不要漏看的傾向，有助於快速察覺周遭的人與動物。' },
          {
            type: 'clarity',
            alt: '一個電源插座的示意圖：兩個直立的插孔在上，一個圓形接地孔在下，看起來像一張臉。',
            caption: '圖一　電源插座是常見的空想性錯視例子',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'facies eorum caſu prodita eſt', // 祂們的模樣意外洩漏了（祂們＝高維存在，不標紅）
            // 通關後的彩蛋（2026-11-17）：看過結局才能拉滑桿。之前一樣搜得到、看得到圖，只是沒有滑桿
            requires: 'cleared',
            lockedCaption: '圖一　電源插座是常見的空想性錯視例子',
            svg:
              '<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">' +
                '<rect x="0" y="0" width="240" height="240" fill="#e9eef0"/>' +
                '<rect x="40" y="30" width="160" height="180" rx="22" fill="#fbfaf6" stroke="#b9c3c7" stroke-width="3"/>' +
                '<rect x="54" y="44" width="132" height="152" rx="14" fill="none" stroke="#dde3e5" stroke-width="2"/>' +
                '<rect x="84" y="80" width="14" height="40" rx="4" fill="#3c464b"/>' +
                '<rect x="142" y="80" width="14" height="40" rx="4" fill="#3c464b"/>' +
                '<path d="M106 168 a14 14 0 0 1 28 0 v6 h-28 z" fill="#3c464b"/>' +
                '<circle cx="120" cy="40" r="4" fill="#c9d1d4"/>' +
                '<circle cx="120" cy="200" r="4" fill="#c9d1d4"/>' +
              '</svg>'
          },
          { type: 'p', text: '腦造影研究發現，觀看像臉的物體時，大腦中處理臉孔的區域也會很快出現反應，時間與觀看真實臉孔相近。這表示「看見臉」可能發生在知覺的早期階段，而不只是事後的聯想。' },
          { type: 'refs', items: [
            'Hadjikhani, N., Kveraga, K., Naik, P., & Ahlfors, S. P. (2009). Early (M170) activation of face-specific cortex by face-like objects. NeuroReport, 20(4), 403–407.',
            'Liu, J., Li, J., Feng, L., Li, L., Tian, J., & Lee, K. (2014). Seeing Jesus in toast: Neural and behavioral correlates of face pareidolia. Cortex, 53, 60–77.'
          ] }
        ]
      },
      {
        id: 'eye-origin',
        title: '眼睛的起源',
        summary: '從感光細胞到相機式眼睛：眼睛在動物演化中如何出現。',
        category: '演化生物學',
        updated: '2026-09-15',
        keywords: ['眼睛的起源', '眼睛起源', '眼睛演化', '眼睛', '寒武紀', '寒武紀大爆發', '三葉蟲', '古生物', '演化', '視蛋白', 'opsin', 'cambrian'],
        blocks: [
          { type: 'p', text: '眼睛是能偵測光線，並把光的資訊轉換成神經訊號的器官。從只能分辨明暗的感光細胞，到能形成清晰影像的複雜眼睛，動物界中存在許多不同的形式。' },
          {
            // 示意圖（Gemini 生成，原檔：圖片原檔/S15-cambrian.jpg）。滑桿和空想性錯視一樣，看過結局才能拉
            type: 'clarity',
            src: 'assets/horizon/cambrian.jpg',
            alt: '寒武紀淺海的復原插畫：海床上有幾隻三葉蟲，一隻奇蝦在水中游，旁邊有海綿和海草，陽光從水面照下來。',
            caption: '圖一　寒武紀淺海的復原示意圖',
            lockedCaption: '圖一　寒武紀淺海的復原示意圖',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'tunc [[illi]] in terram deſcenderunt', // 祂們在這時登陸地球
            requires: 'cleared'
          },
          { type: 'h', text: '感光的分子基礎' },
          { type: 'p', text: '動物視覺的核心是一類稱為視蛋白（opsin）的蛋白質。視蛋白與由維生素 A 衍生的視黃醛結合；視黃醛吸收光子後改變形狀，進而啟動細胞內的訊號傳遞。從水母、昆蟲到人類，動物的感光幾乎都建立在視蛋白之上。' },
          { type: 'h', text: '寒武紀與早期的眼睛' },
          { type: 'p', text: '約 5.4 億年前開始的寒武紀，化石紀錄在相對短的地質時間內出現了大量動物類群，這段時期常被稱為「寒武紀大爆發」。許多寒武紀動物已經具有發育良好的眼睛，例如三葉蟲的複眼由許多以方解石為晶體的小眼組成，是目前已知最古老的視覺系統之一。' },
          { type: 'p', text: '動物學家安德魯．派克（Andrew Parker）提出「光開關假說」，認為眼睛出現後，掠食者與獵物之間的關係劇烈改變，可能推動了這段時期的快速分化。這是解釋寒武紀大爆發的假說之一，學界仍有爭論。' },
          { type: 'h', text: '眼睛演化需要多久' },
          { type: 'p', text: '達爾文在《物種起源》中坦承，認為眼睛這樣精密的器官是由天擇形成，乍看之下極為荒謬；但他接著指出，只要能找到從簡單到複雜、每一階段都對生物有用的一系列中間型態，這個困難就能被克服。\n\n1994 年，尼爾森（Dan-E. Nilsson）與佩爾格（Susanne Pelger）以刻意保守的假設建立模型，估算一片平坦的感光細胞層逐步凹陷、形成透鏡，最後成為相機式眼睛，大約只需要 36 萬個世代。對世代短暫的小型水生動物來說，這在地質時間上相當短。' },
          { type: 'h', text: '不同的眼睛，相似的解法' },
          { type: 'p', text: '章魚與人類都具有構造相似的相機式眼睛，但一般認為兩者是各自獨立演化出來的，屬於趨同演化。兩者也有差異：脊椎動物的視神經纖維位於視網膜內側，匯集後穿出眼球，因此形成盲點；頭足類的感光細胞直接朝向光線，沒有這樣的盲點。\n\n另一方面，調控眼睛發育的基因卻相當保守。1995 年的實驗中，研究者在果蠅身體的其他部位啟動 eyeless 基因，誘發出額外的眼睛；小鼠中與它同源的 Pax6 基因，同樣能在果蠅身上誘發出果蠅的複眼。' },
          { type: 'refs', items: [
            'Darwin, C. (1859). On the Origin of Species. 第六章〈學說的難點〉。',
            'Nilsson, D.-E., & Pelger, S. (1994). A pessimistic estimate of the time required for an eye to evolve. Proceedings of the Royal Society B, 256(1345), 53–58.',
            'Halder, G., Callaerts, P., & Gehring, W. J. (1995). Induction of ectopic eyes by targeted expression of the eyeless gene in Drosophila. Science, 267(5205), 1788–1792.',
            'Parker, A. (2003). In the Blink of an Eye: How Vision Sparked the Big Bang of Evolution. Perseus Publishing.'
          ] }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'immune-privilege',
        title: '免疫豁免',
        summary: '身體裡少數幾個免疫系統不太去打擾的地方，眼睛是其中之一。',
        category: '免疫學',
        updated: '2026-10-06',
        keywords: ['免疫豁免', '免疫特權', '豁免', 'immune privilege', '免疫系統', '免疫'],
        blocks: [
          {
            type: 'p',
            text: '免疫豁免（immune privilege）是指身體裡有少數部位，即使出現外來的組織或抗原，也不太會引發一般程度的免疫反應。已知的免疫豁免部位包括眼睛、腦、睪丸與懷孕時的胎盤。'
          },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-immune.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-immune.jpg）
            alt: '水彩畫的人眼剖面，看得到角膜、水晶體和後面的視神經，眼球外圍包著一層淡淡發光的透明屏障，屏障外有幾顆白血球進不去。',
            caption: '圖一　眼睛和血液之間隔著一層屏障',
            lockedCaption: '圖一　眼睛和血液之間隔著一層屏障',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'corpus tuum [[eum]] non agnoſcit', // 你的身體不認得祂
            requires: 'cleared'
          },
          {
            type: 'h',
            text: '為什麼眼睛需要豁免'
          },
          {
            type: 'p',
            text: '發炎會讓組織腫脹、混濁，對大部分器官來說只是暫時的不適，對眼睛卻可能直接影響視力。眼睛內部有血液－視網膜屏障擋住大部分免疫細胞，眼內的液體也含有會抑制發炎的分子，讓眼睛在面對外來物時傾向「先忍下來」。'
          },
          {
            type: 'h',
            text: '一個意外的發現'
          },
          {
            type: 'p',
            text: '1940 年代，英國生物學家梅達沃（Peter Medawar）發現，移植到兔子眼睛前房的皮膚組織，存活的時間遠比移植到其他部位長。這類觀察讓人開始認為，眼睛是免疫系統刻意避開的地方，而不只是剛好沒被發現。'
          },
          {
            type: 'h',
            text: '豁免失效的時候'
          },
          {
            type: 'p',
            text: '這種保護並不是絕對的。當屏障因為外傷或感染受損，免疫系統接觸到原本「看不見」的眼內抗原，就可能開始攻擊眼睛，例如交感性眼炎：一隻眼睛受傷之後，另一隻健康的眼睛也跟著發炎。'
          },
          {
            type: 'refs',
            items: [
              'Medawar, P. B. (1948). Immunity to homologous grafted skin. III. The fate of skin homografts transplanted to the brain, to subcutaneous tissue, and to the anterior chamber of the eye. British Journal of Experimental Pathology, 29(1), 58–69.',
              'Streilein, J. W. (2003). Ocular immune privilege: therapeutic opportunities from an experiment of nature. Nature Reviews Immunology, 3(11), 879–889.'
            ]
          }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'cataract',
        title: '白內障',
        summary: '眼睛裡的水晶體變得混濁，看東西像隔著一層霧。',
        category: '眼科',
        updated: '2026-10-06',
        keywords: ['白內障', 'cataract', '水晶體', '霧霧的'],
        blocks: [
          {
            type: 'p',
            text: '白內障（cataract）是水晶體變得混濁的狀態。水晶體原本是透明的，負責把光線聚焦到視網膜上；混濁之後，光線會被散射，看東西就像隔著一層霧，也容易覺得刺眼。'
          },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-cataract.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-cataract.jpg）
            alt: '水彩畫的窗景：窗邊木桌上放著茶杯，窗外的樹和街道像蒙上一層乳白色的霧，燈光周圍有光暈。',
            caption: '圖一　水晶體混濁時，瞳孔看起來會泛白',
            lockedCaption: '圖一　水晶體混濁時，瞳孔看起來會泛白',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'phantaſma iam non clarum eſt', // 幻像不再清晰
            requires: 'cleared'
          },
          {
            type: 'h',
            text: '常見的症狀'
          },
          {
            type: 'p',
            text: '視力逐漸模糊、看燈光周圍有光暈、夜間開車特別吃力、顏色看起來變黃變暗。多數人是慢慢發生，一開始常以為只是眼鏡度數不對。'
          },
          {
            type: 'h',
            text: '原因'
          },
          {
            type: 'p',
            text: '最主要的原因是老化，此外紫外線、糖尿病、長期使用類固醇與眼睛外傷都可能讓白內障提早出現。世界衛生組織估計，白內障仍是全球失明的主要原因之一。'
          },
          {
            type: 'h',
            text: '治療'
          },
          {
            type: 'p',
            text: '目前唯一有效的治療是手術：取出混濁的水晶體，換上人工水晶體。有些患者術後會提到，顏色變得比印象中更鮮豔、更偏藍。'
          },
          {
            type: 'refs',
            items: [
              'World Health Organization. (2019). World report on vision. Geneva: WHO.',
              'Liu, Y.-C., Wilkins, M., Kim, T., Malyugin, B., & Mehta, J. S. (2017). Cataracts. The Lancet, 390(10094), 600–612.'
            ]
          }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'glaucoma',
        title: '青光眼',
        summary: '視神經慢慢受損，視野從外圍開始縮小。',
        category: '眼科',
        updated: '2026-10-06',
        keywords: ['青光眼', 'glaucoma', '眼壓', '視野'],
        blocks: [
          {
            type: 'p',
            text: '青光眼（glaucoma）是一類會讓視神經逐漸受損的眼疾，常見的危險因子是眼壓偏高。受損的神經無法再生，所以青光眼造成的視力損失通常是永久的。'
          },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-glaucoma.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-glaucoma.jpg）
            alt: '水彩畫的鄉間小路和田野，中央清楚明亮，四周慢慢被深色暈開遮住，像從管子裡往外看。',
            caption: '圖一　青光眼的視野從外圍開始變暗',
            lockedCaption: '圖一　青光眼的視野從外圍開始變暗',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'obtutus pedem ponere non poteſt', // 目光無法踏足
            requires: 'cleared'
          },
          {
            type: 'h',
            text: '看不見的那一圈'
          },
          {
            type: 'p',
            text: '青光眼最常見的型態一開始沒有任何症狀。視野的缺損通常從外圍開始，大腦會自動「補上」看不到的部分，所以很多人直到視野只剩中間一小塊，像從管子裡往外看，才發現不對勁。'
          },
          {
            type: 'h',
            text: '為什麼要定期量眼壓'
          },
          {
            type: 'p',
            text: '眼睛裡的房水不斷產生、也不斷排出，排出的管道不順時，眼壓就會升高、壓迫視神經。定期量眼壓和檢查視野，是早期發現青光眼最直接的方法。'
          },
          {
            type: 'h',
            text: '治療'
          },
          {
            type: 'p',
            text: '治療的目標是降低眼壓、延緩惡化，方法包括眼藥水、雷射與手術。已經失去的視野無法恢復，所以越早發現越好。'
          },
          {
            type: 'refs',
            items: [
              'Weinreb, R. N., Aung, T., & Medeiros, F. A. (2014). The pathophysiology and treatment of glaucoma: a review. JAMA, 311(18), 1901–1911.'
            ]
          }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'macular-degeneration',
        title: '黃斑部病變',
        summary: '視網膜正中央的黃斑部退化，看東西正中間糊成一塊。',
        category: '眼科',
        updated: '2026-10-06',
        keywords: ['黃斑部病變', '黃斑部', '黃斑', '老年性黃斑部病變', 'macular degeneration', 'AMD'],
        blocks: [
          {
            type: 'p',
            text: '黃斑部是視網膜正中央的一小塊區域，負責最清晰的中央視力，閱讀、認臉、看細節都靠它。黃斑部病變（macular degeneration）就是這個區域退化受損，最常見的是與年齡相關的類型。'
          },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-macular.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-macular.jpg）
            alt: '水彩畫的早餐桌：攤開的報紙、咖啡和吐司，報紙正中央被一團灰色的模糊遮住。',
            caption: '圖一　黃斑部病變時，正中間最先看不清楚',
            lockedCaption: '圖一　黃斑部病變時，正中間最先看不清楚',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'regio media perperam tractatur', // 中央區域處理異常
            requires: 'cleared'
          },
          {
            type: 'h',
            text: '常見的症狀'
          },
          {
            type: 'p',
            text: '直線看起來彎彎曲曲、看東西正中間有一塊模糊或暗影、認不出別人的臉。因為周邊視力通常還在，很多患者形容「看得到四周，就是看不到正在看的那個東西」。'
          },
          {
            type: 'h',
            text: '兩種類型'
          },
          {
            type: 'p',
            text: '乾性較常見，進展緩慢；濕性是視網膜下長出異常的新生血管，可能在短時間內嚴重影響視力。'
          },
          {
            type: 'h',
            text: '自我檢查'
          },
          {
            type: 'p',
            text: '可以用阿姆斯勒方格表在家檢查：遮住一隻眼睛、盯著格子中央的點，如果線條扭曲或某一塊不見了，就應該盡快就醫。'
          },
          {
            type: 'refs',
            items: [
              'Mitchell, P., Liew, G., Gopinath, B., & Wong, T. Y. (2018). Age-related macular degeneration. The Lancet, 392(10153), 1147–1159.'
            ]
          }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'color-vision',
        title: '色覺異常',
        summary: '分辨某些顏色有困難，最常見的是分不出紅和綠。',
        category: '視覺生理',
        updated: '2026-10-06',
        keywords: ['色覺異常', '色盲', '色弱', '紅綠色盲', 'color blindness', 'colorblind', 'dyschromatopsia'],
        blocks: [
          {
            type: 'p',
            text: '色覺異常（俗稱色盲、色弱）是指分辨某些顏色有困難。人的視網膜上有三種感受不同顏色光的錐細胞，其中一種缺少或功能改變，看到的顏色就會和多數人不同。'
          },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-colorblind.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-colorblind.jpg）
            alt: '水彩畫的蘋果樹，左半邊是紅蘋果和綠葉子，右半邊的蘋果和葉子都變成相近的黃褐色。',
            caption: '圖一　左邊是一般人看到的顏色，右邊是紅綠色盲看到的近似顏色',
            lockedCaption: '圖一　左邊是一般人看到的顏色，右邊是紅綠色盲看到的近似顏色',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'colores mentiuntur', // 顏色在說謊
            requires: 'cleared'
          },
          {
            type: 'h',
            text: '紅綠色覺異常'
          },
          {
            type: 'p',
            text: '最常見的是紅綠色覺異常，相關基因位在 X 染色體上，所以男性比例遠高於女性：大約每 12 個男性就有 1 個，女性大約 200 個裡有 1 個。'
          },
          {
            type: 'h',
            text: '怎麼檢查'
          },
          {
            type: 'p',
            text: '最常見的是石原氏色覺檢查表，用大小不一的彩色圓點排出數字，色覺正常和色覺異常的人會讀到不同的答案。'
          },
          {
            type: 'h',
            text: '日常生活'
          },
          {
            type: 'p',
            text: '多數色覺異常的人生活不太受影響，但分辨紅綠燈、看地圖和圖表時可能比較吃力。有研究發現，部分色覺異常者在辨識迷彩、偽裝這類「顏色干擾」的圖形時，反而比一般人敏銳。'
          },
          {
            type: 'refs',
            items: [
              'Simunovic, M. P. (2010). Colour vision deficiency. Eye, 24(5), 747–755.',
              'Birch, J. (2012). Worldwide prevalence of red-green color deficiency. Journal of the Optical Society of America A, 29(3), 313–320.'
            ]
          }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'glasses',
        title: '眼鏡',
        summary: '在眼睛前面多放一片鏡片，把光線重新對焦。',
        category: '光學',
        updated: '2026-10-06',
        keywords: ['眼鏡', '近視', '遠視', '老花', '鏡片', 'glasses', 'spectacles'],
        blocks: [
          {
            type: 'p',
            text: '眼鏡是在眼睛前面多加一片鏡片，改變光線進入眼睛的路徑，讓影像重新聚焦在視網膜上。近視用凹透鏡、遠視和老花用凸透鏡，散光則用柱面鏡片矯正。'
          },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-glasses.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-glasses.jpg）
            alt: '水彩畫的靜物：一副圓框眼鏡擺在攤開的舊書上，旁邊有眼鏡布和小放大鏡。',
            caption: '圖一　圓框眼鏡',
            lockedCaption: '圖一　圓框眼鏡',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: '[[cuſtodes]] diu vigilantes reficiendi ſunt', // 守望久了也是需要維護的
            requires: 'cleared'
          },
          {
            type: 'h',
            text: '眼鏡的歷史'
          },
          {
            type: 'p',
            text: '一般認為眼鏡在 13 世紀末出現在義大利，最早是給老花的人看書用的凸透鏡，夾在鼻子上或拿在手上。到了 16 世紀才出現矯正近視的凹透鏡。'
          },
          {
            type: 'h',
            text: '近視為什麼越來越多'
          },
          {
            type: 'p',
            text: '近視是眼球前後太長，遠處的影像聚焦在視網膜前面。近視的比例在東亞特別高，研究認為和長時間近距離用眼、戶外活動時間太少有關。'
          },
          {
            type: 'h',
            text: '隱形眼鏡'
          },
          {
            type: 'p',
            text: '隱形眼鏡直接貼在角膜上，視野比框架眼鏡寬，但角膜需要氧氣，配戴太久或清潔不當容易引起發炎。'
          },
          {
            type: 'refs',
            items: [
              'Ilardi, V. (2007). Renaissance Vision from Spectacles to Telescopes. Philadelphia: American Philosophical Society.',
              'Morgan, I. G., Ohno-Matsui, K., & Saw, S.-M. (2012). Myopia. The Lancet, 379(9827), 1739–1748.'
            ]
          }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'floaters',
        title: '飛蚊症',
        summary: '看向明亮的地方時，眼前飄著小黑點或細線。',
        category: '眼科',
        updated: '2026-10-06',
        keywords: ['飛蚊症', '飛蚊', '黑點', 'floaters', '玻璃體'],
        blocks: [
          {
            type: 'p',
            text: '飛蚊症（floaters）是看向天空或白牆等明亮的地方時，眼前好像有小黑點、細線或蜘蛛網狀的東西飄來飄去，轉動眼睛時它們也跟著移動，想直接看清楚卻總是滑開。'
          },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-floaters.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-floaters.jpg）
            alt: '水彩畫的藍天白雲，天空中飄著幾條半透明的灰色細線和小圈圈。',
            caption: '圖一　看著藍天時，飛蚊症的樣子',
            lockedCaption: '圖一　看著藍天時，飛蚊症的樣子',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'umbrae eorum natant', // 祂們的影子在游（祂們＝高維存在，不標紅）
            requires: 'cleared'
          },
          {
            type: 'h',
            text: '它們是什麼'
          },
          {
            type: 'p',
            text: '眼球裡充滿透明的膠狀物質，叫做玻璃體。隨著年紀增長或高度近視，玻璃體會慢慢液化、纖維聚集成團，光線照進來時，這些團塊的影子投在視網膜上，就成了「飛蚊」。'
          },
          {
            type: 'h',
            text: '需要擔心嗎'
          },
          {
            type: 'p',
            text: '大多數的飛蚊症是正常的老化現象，不需要治療，時間久了大腦也會慢慢習慣忽略它們。但如果黑點突然大量增加、看到閃光，或視野像被簾子遮住一角，可能是視網膜裂孔或剝離，應該立刻就醫。'
          },
          {
            type: 'refs',
            items: [
              'Milston, R., Madigan, M. C., & Sebag, J. (2016). Vitreous floaters: Etiology, diagnostics, and management. Survey of Ophthalmology, 61(2), 211–227.'
            ]
          }
        ]
      },
      // 【草稿】詞條（2026-11-24 新增）：科普內文是真的，示意圖裡藏著 0 號使者的拉丁文（滑桿拉糊才看得到）
      {
        id: 'night-blindness',
        title: '夜盲症',
        summary: '天一暗就看不清楚，從亮處走進暗處特別久才適應。',
        category: '視覺生理',
        updated: '2026-10-06',
        keywords: ['夜盲症', '夜盲', '暗適應', '夜視', '關燈', 'night blindness', 'nyctalopia'],
        blocks: [
          { type: 'p', text: '夜盲症（night blindness）是指在光線昏暗的地方視力明顯變差，例如黃昏時看不清路、走進電影院後很久都找不到座位。它不是一種獨立的疾病，而是好幾種眼睛問題共同的症狀。' },
          {
            type: 'clarity',
            src: 'assets/horizon/wiki-night.jpg', // 水彩示意圖（Gemini 生成，原檔：圖片原檔/S16-wiki-night.jpg）
            alt: '水彩畫的夜晚巷子，只有一盞路燈照亮地上一小圈和牆邊的盆栽，其他地方幾乎一片暗藍。',
            caption: '圖一　夜盲症的人，在路燈照不到的地方幾乎什麼都看不見',
            lockedCaption: '圖一　夜盲症的人，在路燈照不到的地方幾乎什麼都看不見',
            label: '清晰度',
            maxBlur: 12,
            revealBelow: 25,
            revealText: 'tenebrae [[cuſtodem]] fallunt', // 黑暗騙過守望者
            requires: 'cleared'
          },
          { type: 'h', text: '眼睛怎麼在暗處看東西' },
          { type: 'p', text: '視網膜上有兩種感光細胞：負責顏色和細節的錐細胞，以及對微弱光線很敏感的視桿細胞。從亮處走進暗處時，視桿細胞要二、三十分鐘才能把敏感度調到最高，這個過程叫做暗適應。夜盲症的人，正是視桿細胞這一段出了問題。' },
          { type: 'h', text: '常見的原因' },
          { type: 'p', text: '缺乏維生素 A 是全世界最常見的原因：視桿細胞裡負責感光的視紫質需要維生素 A 才能合成。此外，視網膜色素病變這類遺傳疾病、高度近視、白內障也可能造成夜盲。' },
          { type: 'h', text: '日常建議' },
          { type: 'p', text: '如果發現自己晚上開車、走夜路特別吃力，應該先請眼科檢查原因。缺乏維生素 A 造成的夜盲補充後通常能改善，遺傳性的則需要長期追蹤。' },
          { type: 'refs', items: [
            'Lamb, T. D., & Pugh, E. N. (2004). Dark adaptation and the retinoid cycle of vision. Progress in Retinal and Eye Research, 23(3), 307–380.',
            'World Health Organization. (2009). Global prevalence of vitamin A deficiency in populations at risk 1995–2005. Geneva: WHO.'
          ] }
        ]
      },
      {
        // 論壇入口：首頁歡迎詞裡的粗體「論壇」是線索，搜尋後從這裡進去。title 要和 forum.name 一樣
        id: 'forum',
        title: '同好論壇',
        summary: '和認知科學的同好們交流的討論區。',
        category: '討論區',
        updated: '2026-11-01',
        keywords: ['論壇', '討論區', '同好', 'forum'],
        href: 'forum.html',
        blocks: []
      },
      {
        // 研究中心的得獎公告：只有搜研究員本名才找得到（搜「新聞」找不到，免得跳過論壇的上鎖文章）。照片裡的識別證寫著工號（登入單位網站用）
        id: 'award-news',
        title: '賀！本中心研究員許至恆榮獲生醫工程學術成果獎',
        summary: '明域視覺科技研究中心　公告',
        category: '公告',
        updated: '2026-05-20',
        keywords: ['許至恆'],
        blocks: [
          { type: 'p', text: '賀！本中心研究員許至恆，於本屆生醫工程研討會的學術成果發表中，以「淚液結晶影像於乾眼症篩檢的應用」獲頒學術成果獎。這套方法只需要將眼淚晾乾後放進電子顯微鏡，就能從結晶的形狀判讀淚液的品質。評審認為，它有機會讓偏鄉的眼科篩檢更容易進行。' },
          { type: 'img', src: 'assets/news/researcher.jpg', alt: '許至恆穿著白袍、手持獎座的照片，胸前掛著識別證。', caption: '許至恆於頒獎典禮' },
          { type: 'p', text: '許至恆致詞時表示，獎項屬於所有提供幫助的人。\n「感謝主管協助我申請經費，還有各位合作醫師，沒有你們我無法通過IRB！」' },
          { type: 'p', text: '本中心同仁與有榮焉，特此公告。' }
        ]
      },
      {
        // 研究筆記第 05 則提到的「隕石的舊新聞」。年代放在寒武紀，和「眼睛的起源」的紅字「登陸時間」接起來
        id: 'meteorite-news',
        title: '寒武紀地層的隕石碎片驗出不明立方晶體',
        summary: '研究團隊在約 5.4 億年前的地層中發現含有立方晶體的隕石碎片。',
        category: '新聞',
        updated: '2024-03-08',
        keywords: ['新聞', '隕石', '隕石碎片', '立方晶體', '不明晶體'],
        blocks: [
          { type: 'p', text: '研究團隊在約 5.4 億年前的地層中找到數塊隕石碎片，內含邊長約 5 毫米、排列成圓環的立方晶體。' },
          { type: 'img', src: 'assets/horizon/meteorite.jpg', alt: '切開磨平的深色隕石碎片，切面上有一圈淺色的方形晶體，旁邊放著一把尺。', caption: '隕石碎片的切面示意。（研究團隊提供）' },
          { type: 'p', text: '團隊以電子顯微鏡搭配元素分析檢驗這些晶體，但能譜上的訊號無法對應任何已知元素。團隊表示，目前不排除樣品在保存過程中受到污染，結果仍待其他實驗室重複驗證。\n\n筆者發現，這批地層的年代，恰好接近動物在短時間內大量演化出眼睛的時期。但團隊成員受訪時強調，兩者之間沒有證據顯示有任何關聯。' }
        ]
      },
      {
        // 【草稿】離開教團的視障者專訪。玩家進過教團網站、知道名字之後，回視界搜「闔目團契」找得到（補充用，和其他詞條一樣寬鬆搜尋）
        // 用途：從外面看教團；他失明之後什麼都沒看見，和教團的說法對不上，但他也說不準那代表什麼。
        // 架構：導言 → 怎麼加入 → 哪裡不對勁 → 為什麼離開 → 他自己的說法 → 團契的回應
        id: 'fellowship-interview',
        title: '專訪｜「他們需要看不見的人」',
        summary: '一位中途失明的受訪者，談他在闔目團契的兩年。',
        category: '新聞',
        updated: '2025-06-14',
        keywords: ['新聞', '闔目團契'],
        blocks: [
          { type: 'p', text: '阿澤（化名）三十四歲那年因為視網膜病變失明。失明後的第三年，朋友帶他去了一個每週三晚上關燈聚會的團體。因緣際會下，他決定參與我們的專訪。' },
          { type: 'h', text: '他們挺友善的' },
          { type: 'p', text: '沒有人收我錢。有人開車載我去回診，有人陪我練點字。讓我覺得我不是異類。\n在那裡，看不見的人被稱為使者，聚會時由使者先說話。我是當時最年輕的一位。' },
          { type: 'h', text: '他們一直問我看見了什麼' },
          { type: 'p', text: '這就怪了，失明是能看到什麼呢？我說我什麼都看不見，黑漆漆的。他們會笑一笑，說再等等。好像我只是還沒準備好。\n有一位大姊視力開始變差，大家圍著恭喜她。我勸她去看醫生，她說這是好事。那天我開始覺得那裡的人大概腦子有點問題......' },
          { type: 'h', text: '離開' },
          { type: 'p', text: '我在第二年退出。沒有人攔我，也沒有人再聯絡我。一開始還挺失落的，但現在想想這應該是好事。\n\n「你覺得自己失明後有遇過怪事嗎？」\n\n至少我沒印象。那代表他們錯了，還是我沒遇到，不好說，我想從從容容游刃有餘的生活就好。\n---------------------------------------------------------------------------------------------------------------------------------\n本刊去信詢問，團契以書面回覆一句話：「我們尊重每一位離開的朋友，也為他等候。」' }
        ]
      },
      {
        // 研究員隸屬單位的網站入口：用單位名稱搜得到。title 要和 lab.unitName 一樣
        id: 'society',
        title: '明域視覺科技研究中心',
        summary: '1987 年成立的研究機構，主要活動為研發視能輔具。',
        category: '外部連結',
        updated: '2026-05-20',
        keywords: ['明域視覺科技研究中心', '明域', '明域視覺', '明域研究中心'],
        href: 'lab/index.html',
        blocks: []
      },
      {
        // 研究中心的內部文件：在視界搜「許至恆」也找得到，點了開研究中心的日記頁（還是要登入、要密碼）。研究中心那邊搜「許至恆」也會列出得獎新聞（lab.search.links）
        id: 'xu-diary',
        title: '許至恆的日記',
        summary: '明域視覺科技研究中心　內部文件',
        category: '外部連結',
        updated: '2026-10-24',
        keywords: ['許至恆'],
        href: 'lab/index.html#doc-diary',
        blocks: []
      }
    ]
  },

  /* ----------------------------------------------------------
   * notices：解鎖後出現在首頁「最新公告」最上面的公告
   * ----------------------------------------------------------
   *   id        公告代號
   *   requires  哪個事件發生後出現（填事件代號；'cleared' 是看過結局）
   *   text      公告文字
   *   link      （選填）公告最後的連結 { text: '連結文字', href: '網址' }
   * 日期自動使用玩家「第一次看到這則公告」那天的日期，之後固定不變。
   */
  notices: [], // 2026-11-17：原本通關後的那則公告搬到結局下方（ending.after.notice）

  /* ----------------------------------------------------------
   * ads：視界首頁的假廣告（js/ad.js）。設定上是高維存在偷偷塞進網站的干擾，玩起來只是好笑。
   * ----------------------------------------------------------
   * 待在首頁超過 delay 毫秒，左下角跳出一則（runner 或 granny 隨機一個），點了在原本這一頁跳到 404.html。
   * 伏筆都藏在數字和名字裡，解完劇情才看得出來：
   *   label 的「零號」＝結局的 0 號使者　runner.level 的 27413＝林永昇日記的密碼（色盲圖上真正的數字）
   *   跑酷終點那一圈方塊＝抄本的輪子、後山的「輪仔」　granny 的 1997＝第一位使者入會那年，阿嬤坐的報紙窗前＝第一位使者的照片
   */
  ads: {
    delay: 10000,
    label: '廣告・零號互動',
    close: '關閉廣告',
    // runner.gates：三道門，每道左右兩扇；小人從 6 個開始，最少 1 個、最多 20 個
    runner: { level: '第 27413 關', hint: '只有 1% 的人過得了！', gates: [['+3', '×2'], ['−2', '+4'], ['×2', '−3']], installs: '下載數 5000 萬+　★★★★☆' },
    granny: { title: '阿嬤看不見了！', question: '你會怎麼幫她？', options: ['眼藥水', '墨鏡'], installs: '下載數 1997 萬+　★★★★★',
      image: 'assets/horizon/ad-granny.jpg', alt: '3D 卡通風格的阿嬤閉著眼睛、一臉委屈地坐在破舊的房間裡，窗戶貼滿報紙，地上倒著水桶。' }
  },

  /* ----------------------------------------------------------
   * profile：個人資料頁
   * ---------------------------------------------------------- */
  /* ----------------------------------------------------------
   * ending：最後的警告、最後一題、兩個結局（顯示在 result.html）
   * ----------------------------------------------------------
   * 什麼時候出現：異常題全部解鎖，而且每一題都選了異常的答案。
   * 只要有一題選了正常的答案，就不會出現，結果頁照常出結果卡。
   * 選「是」是結局一，選「否」是結局二。按「返回」可以回到題目改選，選了什麼不會存起來。
   * 看過任一個結局會記下事件 event（通關），解開通關後的彩蛋（知識庫空想性錯視的滑桿）。之後就是自由遊玩。
   * after：兩個結局內文的下方共用，由上到下：
   *   notice     一行注意事項，後面接 link（通關後的彩蛋入口：空想性錯視詞條）
   *   from       最下面的連結文字，點了展開 letter（0 號使者給玩家的話）。結局填了 noLetter: true 就不出現（連同眼藥水）
   *   eyedrops   0 號使者的話裡的按鈕（接在第一個 >> 右邊）：點了關掉所有眼疾效果，再點一次恢復（記在進度裡，每個網站都套用）。eyedropsOn 是關掉時按鈕上的字
   * 以下都是草稿。每個結局上面的註解是寫作順序，細修時照著寫就不會漏。
   */
  ending: {
    event: 'cleared',
    // warning 一句一個錯誤視窗（遇到 。？！ 或換行就切），按「確定」才出下一句；全部按完才出現最後一題。
    // 視窗裡的字是紅色，不受眼疾效果影響。popupTitle 是視窗標題列，popupOk 是按鈕
    popupTitle: 'Error',
    popupOk: '確定',
    // 警告：告訴玩家已經看得夠多了，再往下沒有回頭路
    warning: '你找到了所有異常題\n\n而且選了所有的錯誤答案，即使我給了你提示。也許你已接觸汙染？\n\n我得確認這件事......剩下最後一題，想清楚了，這會影響你的人生\n\n當然，我會建議你選「是」',
    question: '你感受到的世界是真實的嗎？',
    yes: '是',
    no: '否',
    back: '返回',
    after: {
      notice: '注意：詞條圖片問題已處理完成。',
      link: { text: '資料庫', href: 'wiki.html' }, // 連到知識庫首頁，玩家自己去找哪個詞條變了
      from: '來自 0 號使者',
      // 一整格寫完：空一行是新的一段，只換行就是段落裡換行。神奇眼藥水的按鈕接在第一個 >> 的右邊（沒有 >> 就放在最後）
      letter: '感謝遊玩。不管如何，你都協助了我們的偉大事業\n雖然希望你加入我們的行列，但若是你還想滿足於虛假的世界，可以使用這個眼藥水 >>',
      eyedrops: '神奇眼藥水',
      eyedropsOn: '神奇眼藥水'
    },
    endings: {
      // 每個結局的 text 是一整格：空一行是新的一段，只換行就是段落裡換行
      // 結局一：選「是」。封印沒有鬆動，日子照常，但已經回不去了（比較平淡的那個）
      // 寫作順序：一、確認：畫面恢復正常／二、代價：什麼都沒發生，但你已經知道了／三、之後：看起來和以前一樣，卻再也不一樣（照鏡子、和人對視、關燈）／四、收尾
      yes: {
        title: '結局一',
        text: '你點了「是」。\n\n網頁很順暢地跳轉了。原本那些詭異的文字和畫面消失得無影無蹤，甚至跳出一個正常的測驗結果頁面，下面附著分享按鈕。\n\n你鬆了一口氣，把分頁關掉。\n\n沒事，什麼都沒發生。你甚至開始覺得，剛剛在網站裡挖出來的那些筆記跟名冊，大概真的只是哪個無聊的創作者寫出來的都市傳說吧，只是你寧可信其有，不可信其無，就算是虛構的也會選擇安全選項。\n\n日子照常過。\n\n只是從那天起，你偶爾會覺得不太對勁。\n\n就像有人突然提醒你「你正在呼吸」一樣，你偶爾會沒辦法忽略自己眼睛的存在。轉動視線，濕潤的球體正在眼眶內滾動的感覺太明顯了，明明以前從來沒這樣過的。還有，當你想要看向某物時，視線移動的速度似乎與大腦不同步。看了醫生，不管是眼球還是神經似乎都沒有新的問題。\n\n每次這種時候，你會忍不住想：這真的是我身體長出來的器官嗎？\n\n跟朋友聊天聊到一半，看著對方的眼神，腦袋裡也會突然閃過一個很荒謬的念頭——現在看著我的，到底是他，還是他臉上那一對？\n\n晚上關燈躺上床，你閉上眼，但總覺得眼皮底下的它們好像沒有跟著休息，至少在你睡著前還是微微動著。\n\n隔天早上醒來，天空還是藍的，蝴蝶悠閒地飛著，街道也很平靜。\n一切都很正常。你相信你感受到的世界是真實的。\n\n\n而[[祂們]]，也繼續盡責地讓你這樣相信。'
      },
      // 結局二：選「否」。高維存在直接接觸現實
      // 寫作順序：一、確認：封印鬆開的那一刻／二、接觸：理解了不該理解的東西／三、眼睛的真相：牠們是中立的／四、之後：日常裡的異常變多（寫幾個具體的小場景）／五、收尾
      no: {
        title: '結局二',
        noLetter: true, // 壞結局：世界已經崩了，0 號使者不會來道謝，也沒有眼藥水
        text: '你點了「否」。\n\n網頁沒有跳轉，也沒有出現什麼嚇人的跳臉特效。畫面就只是停在那裡，安靜得有點尷尬。你盯著螢幕看了幾秒，心裡甚至冒出一點空虛感——搞了半天，就這樣？\n\n你把視線從螢幕移開，想讓眼睛休息一下。\n\n但突然覺得不太對勁。\n\n說不上來哪裡奇怪。書桌還在原地，牆壁也好好的，可你盯著牆角看了一會兒，突然覺得無法理解。就像盯著一個很熟的字看太久，然後就認不得它一樣，你現在看著這間自己住了這麼久的房間，腦袋卻一時轉不過來，搞不懂牆壁跟天花板之間是什麼關係。\n\n你的眼睛突然很痠，可是自己明明有跟螢幕保持距離，也有每隔30分鐘休息一次啊？\n\n前面那些線索一直叫你別相信眼睛，你以為自己很清醒，這只是陰謀論的笑話。可如果這個網站本來就是個漏洞呢？如果[[祂們]]費盡心思把這裡偽裝成一個無聊的心理測驗，只是希望你做完、笑兩聲，然後把分頁關掉呢？\n\n難道這些都是真的？不不不，怎麼可能。\n    \n好像每個人小時候都畫過那種東西——奇形怪狀的動物，扭曲的線條。大人看了總會笑著說「想像力真豐富」，你長大後也以為，那只是因為當時手還不穩、不會畫畫。\n            \n但現在你突然覺得一陣反胃。\n\n那時候你的眼睛還沒長好，尚未熟練如何映照出一個令人安心的世界。你畫的從來不是想像，你只是把看到的東西照實畫下來而已。\n\n為什麼你知道？\n\n因為眼前的景象開始變成那種模樣了，扭曲、充滿「童趣」......\n\n也許這只是幻覺？可是看到馬路上咧開一張大嘴把路人吞下時你說服不了自己這是假的。\n\n只要你能認知到那些存在，祂們做的事就會成真。\n然而你也來不及找解方了。\n\n因為你已經開始想不起來\n天空是什麼顏色\n蝴蝶有多大\n人類有幾個眼睛......................人類有　眼　睛\n　　　　　　　　　　　　　　　　　　嗎\n　　　　　　　　　　　　　　　　　　？'
      }
    }
  },

  profile: {
    title: '個人資料',
    intro: '開始作答前請先填寫暱稱和年齡，系統會選用對應年齡層的參考資料。資料只保存在你目前使用的瀏覽器中。',
    nicknameLabel: '暱稱',
    nicknameHint: '最多 20 字。',
    ageLabel: '年齡',
    ageHint: '請填 0 到 120 之間的整數。',
    required: '暱稱和年齡都要填寫。',
    // 年齡填 ageWarnUpTo 以下（含）時，年齡欄下方出現的紅字。只是提示，仍然可以儲存
    ageWarnUpTo: 11,
    ageWarn: '建議年滿 12 歲再參與此測試',
    // 年齡填到 upTo 歲以下（含）會記下事件 event，解鎖一題異常題。之後把年齡改回來，題目也不會消失
    childAge: { upTo: 12, event: 'child-age' }, // 12 歲以下。線索是首頁受測須知的「未滿 12 歲」和論壇〈孩童畫作雜談〉
    ageInvalid: '年齡請填 0 到 120 之間的整數。',
    saveButton: '儲存',
    saved: '已儲存。',
    subjectIdLabel: '受測編號',
    subjectIdNone: '尚未產生（開始作答後產生）',
    answeredLabel: '已作答題數'
  },

  /* ----------------------------------------------------------
   * effects：眼疾效果（js/effects.js）
   * ----------------------------------------------------------
   * 對應世界觀「眼睛被免疫系統發現時會被攻擊」：玩家每多看見一點，網站多一種輕微症狀。
   *   map       對應表，每列 { requires: 異常題 id 或事件代號, type: 效果 }。同一種效果只會套用一次
   *             事件代號是內容裡各處 event 欄位填的字：lab.sem.eye.event、lab.files 的 event、lab.search.event、cult.files 的 event、profile.childAge.event、論壇文章 lock 的 event
   *             type 只能是 'cataract'（白內障）、'glaucoma'（青光眼）、
   *             'macular'（黃斑部病變）、'colorblind'（色覺異常）
   *   strength  各效果的強度 0~1，沒填就是 1。以「不影響閱讀」為上限，可用 dev/effects.html 試看
   * 效果一旦出現，就疊在所有畫面上（視界、論壇、研究單位網站、模擬 SEM、教團網站），直到通關結局；「重新開始」也會清掉。
   *   toast／names  多一種效果時右下角的提示：{name} 換成 names 裡的英文病名，{n}/{total} 是已經出現幾種／一共幾種。
   *             使者專區要四種效果和五題異常題全部到齊才進得去，玩家靠這個知道還差幾種
   *   colorblindBoost  色覺異常時把藍黃差異放大幾倍（1＝不放大，標準綠色盲模擬；最多 4）。
   *             放大後反向色盲圖的數字更清楚，但整個網站的藍色與黃色會更飽和，黑白灰不受影響。
   * 把 glaucoma（青光眼）或 macular（黃斑部病變）加進對應表之前，請先在 dev/effects.html 四種全開、按「測量捲動流暢度」（視窗要在最前面），p95 在 34 以下再上線。
   */
  effects: {
    map: [
      { requires: 'sem-eye', type: 'cataract' },    // 在模擬 SEM 看見眼睛
      { requires: 'lab-file', type: 'colorblind' }, // 在研究單位網站解開用點字提示的加密文件
      { requires: 'cult-file', type: 'macular' },   // 在教團網站用色盲圖的數字打開成員留下的文件
      { requires: 'cult-site', type: 'glaucoma' }   // 在研究單位網站輸入兩句暗號、進入教團網站
    ],
    strength: { cataract: 0.45, glaucoma: 0.75, macular: 0.8, colorblind: 1 },
    toast: '{name} {n}/{total}',
    names: { cataract: 'cataract', glaucoma: 'glaucoma', macular: 'macular degeneration', colorblind: 'dyschromatopsia' },
    // 測試用：每一頁左下角出現「清除眼疾效果」的按鈕。上線前把這一行刪掉，按鈕就不會出現
    // 測試用：每一頁左下角多一顆「全權限」按鈕，按了拿到四種效果、解鎖五題異常題、登入研究中心，然後跳到使者專區。上線前把這一行刪掉
    // 測試用：「退回這一頁」按鈕，只把目前這一頁解開的東西鎖回去（例如林永昇的日記回到輸入密碼的畫面）。上線前把這一行刪掉
    colorblindBoost: 2.5,
    colorblindBoostFellowship: 1.8 // 教團網站本來就是暖色，放大太多整頁會太黃，單獨調低一點（色盲圖在論壇，不受影響）
  },

  /* ----------------------------------------------------------
   * forum：論壇（forum.html）
   * ----------------------------------------------------------
   * 入口：首頁歡迎詞裡的粗體「論壇」→ 站內搜尋「論壇」→ wiki.entries 裡 href 指向 forum.html 的那一筆。
   * 學術區和閒聊區的文章一進去就看得到；上鎖的文章在列表上是黑框，要用指定帳號登入才打得開。
   * 玩家沒有自己的帳號，登入只是謎題的鎖。
   *
   *   name／intro  論壇名稱與頁首說明（名稱改了，wiki.entries 裡入口那一筆的 title 要一起改）
   *   boards       分區：{ id, name, desc 一行說明（選填） }
   *   accounts     可以登入的帳號：{ id 帳號, nickname 暱稱, password 密碼 }
   *                密碼是生日四碼（月日，例如 11 月 20 日是 '1120'）。帳號要以「@帳號」的寫法出現在
   *                某篇沒上鎖文章的作者或留言者名字裡，玩家才知道要填什麼（tests/check.js 會檢查）。
   *   posts        文章，依陣列順序顯示。每篇欄位：
   *     id        文章代號（不能用 'login'），上線後不要改
   *     board     分區 id
   *     title     標題
   *     author    作者，寫成「暱稱（@帳號）」
   *     date      發文日期 'YYYY-MM-DD'
   *     lock      （選填）上鎖，兩種鑰匙：
   *               { type: 'login', account: '帳號' }＝用這個帳號登入才看得到
   *               { type: 'code', code: '密碼', event: '事件代號' }＝輸入密碼打開，之後一直開著；event 可以拿去當眼疾效果的條件
   *               要加別種鑰匙，在 js/progress.js 的 canReadPost 加一種 type
   *     blocks    內文，由上到下排列：
   *       { type: 'h' | 'p' | 'red', text: '文字' }
   *       { type: 'braille', text: '點字' }
   *       { type: 'img', src: '圖片路徑', alt: '文字說明', caption: '圖說（選填）' }
   *       { type: 'plate', alt, caption, digits: [...] }  — 反向色盲圖，每個數字一張
   *           digits 每項 { text: 藏的數字, decoyText: 假數字, seed: 亂數種子 }，其他參數見 js/plate.js 的 build
   *     comments  留言：{ author, text }；點字留言寫 { author, braille }；回覆放在 replies 裡，格式相同
   * 文章與留言是依企劃大綱寫的初稿，可以直接改。
   */
  forum: {
    name: '同好論壇',
    intro: '和認知科學的同好們討論。請遵守版規，理性發言。',
    boards: [
      { id: 'academic', name: '學術討論', desc: '知覺、記憶、注意力，還有一切看起來像學術的東西。' },
      { id: 'chat', name: '閒聊', desc: '測驗心得、生活瑣事，離題也沒關係。' }
    ],
    accounts: [
      // 【佔位】下落不明的研究者。暱稱、帳號、生日都待定；改生日時「有沒有人知道…去哪了」那篇的留言要一起改
      { id: 'chhsu', nickname: 'C.H.', password: '1120' }
    ],
    ui: {
      guest: '目前身分：訪客',
      login: '登入',
      logout: '登出',
      loggedInAs: '已登入：{name}',
      back: '回到文章列表',
      boardsLabel: '分區', // 列表上方分區分頁的名稱（給螢幕閱讀器）
      notFound: '找不到這篇文章，可能已經刪除。',
      lockedTitle: '██████',
      lockedLabel: '已上鎖的文章',
      locked: '這篇文章已上鎖，只有作者本人可以閱讀。',
      commentCount: '{n} 則留言',
      poster: '樓主',
      floor: '{n} 樓',
      commentsTitle: '留言（{n}）',
      noComments: '還沒有留言。',
      commentClosed: '留言功能維護中，暫時無法發表新留言。',
      codeLocked: '這篇文章設了密碼。',
      codeLabel: '密碼',
      codeButton: '開啟',
      codeWrong: '密碼錯誤。',
      // 文章列表的分頁（每頁 perPage 篇，新的在前面）
      perPage: 8,
      pagesLabel: '頁數',
      prevPage: '上一頁',
      nextPage: '下一頁',
      loginTitle: '會員登入',
      idLabel: '帳號',
      idHint: 'ID名稱',
      passwordLabel: '密碼',
      passwordHint: '新帳號的預設密碼為生日四碼（例如 3 月 7 日是 0307），請登入後儘速修改',
      loginButton: '登入',
      loginFailed: '帳號或密碼錯誤。',
      alreadyLoggedIn: '你已經登入了。',
      registerClosed: '目前暫停新會員註冊。'
    },
    posts: [
      // ===== 學術討論 =====
      {
        // 用途：給玩家英文字母的點字對照表（之後翻譯隱藏頁的盲文要用），並埋下「繞過眼睛的文字」
        id: 'braille',
        board: 'academic',
        title: '點字是怎麼讀的？六個點的文字入門',
        author: '點點（@dotnote）',
        date: '2026-08-21',
        blocks: [
          { type: 'p', text: '最近在整理觸覺閱讀的資料，順手寫一篇入門。點字（盲文）是給視障者用手指閱讀的文字，由法國人路易．布萊葉（Louis Braille）在 1824 年左右設計出來\n\n每個點字是一「方」，裡面有兩排、每排三個點的位置，總共六個點。每個位置可以凸起或不凸起，所以一共有 64 種組合\n\n讀的人不靠眼睛，而是用指腹摸過去。有趣的是，研究發現先天失明的人摸讀點字時，大腦的視覺皮質也會活化，可以說是眼睛管不到的文字' },
          { type: 'h', text: '英文字母對照' },
          { type: 'p', text: 'a ⠁　b ⠃　c ⠉　d ⠙　e ⠑　f ⠋　g ⠛　h ⠓　i ⠊　j ⠚\n\nk ⠅　l ⠇　m ⠍　n ⠝　o ⠕　p ⠏　q ⠟　r ⠗　s ⠎　t ⠞\n\nu ⠥　v ⠧　w ⠺　x ⠭　y ⠽　z ⠵　撇號 ⠄' }
        ],
        comments: [
          { author: '阿凱（@kai_22）', text: '視覺皮質還能活化，這算一種再利用嗎？' },
          { author: '豆漿不加糖（@soy_0sugar）', text: '這跟認知科學有關嗎？' },
          // 英文一級點字的 "don't trust eyes"
          { author: '（帳號不存在）', braille: '⠙⠕⠝⠄⠞ ⠞⠗⠥⠎⠞ ⠑⠽⠑⠎', replies: [
            { author: '豆漿不加糖（@soy_0sugar）', text: '樓上何意味' }
          ] },
          { author: '晴媽（@ching_0917）', text: '點字好難，我摸了半天只摸得出有凸起' },
          { author: '安安老師（@an_draws）', text: '之前帶小朋友玩過點字卡，大家都超專心，比畫畫還安靜' }
        ]
      },
      {
        // 用途：反向色盲圖。正常視覺讀到假數字，拿到色覺異常效果後才讀得到真的 5 位數
        id: 'colorblind',
        board: 'academic',
        title: '紅綠色盲看到的世界',
        author: '老林（@lin_1962）',
        date: '2026-09-04',
        blocks: [
          { type: 'p', text: '紅綠色覺異常是最常見的色覺異常，大約每 12 個男性就有 1 個，女性大約 200 個裡有 1 個。相關基因在 X 染色體上，所以男性的比例高很多。\n\n檢查用的色盲圖（石原氏色覺檢查表）是日本眼科醫師石原忍在 1917 年發表的：用大小不一的彩色圓點排出數字，有一種說法是，色盲不是缺陷，他們能看到一般人看不到的東西。\n這不完全是安慰，有實驗發現，紅綠色盲的人比較不會被顏色干擾，對於明暗變化更加敏感，看得出一般人找不到的圖案。\n\n下面這組圖，大家看到什麼數字？' },
          {
            type: 'plate',
            alt: '五張由彩色圓點組成的圓形圖，每張藏著一個數字。',
            caption: '色覺檢查圖',
            // 【佔位】藏的數字 27413、假數字 74132。容易混的 8／9、5／6 先避開。
            // 改假數字時，下面第一則留言裡的數字要一起改；改藏的數字時，教團網站那份文件（cult.files）的 code 要一起改
            digits: [
              { text: '2', decoyText: '7', seed: 101 },
              { text: '7', decoyText: '4', seed: 102 },
              { text: '4', decoyText: '1', seed: 103 },
              { text: '1', decoyText: '3', seed: 104 },
              { text: '3', decoyText: '2', seed: 105 }
            ]
          }
        ],
        comments: [
          { author: '阿凱（@kai_22）', text: '這不是色盲也看得到吧，不就是 74132', replies: [
            { author: '還沒睡（@stillawake03）', text: '我看到的也是這個。所以這張圖到底在考什麼' }
          ] },
          { author: '晴媽（@ching_0917）', text: '我老公是紅綠色盲，但他把檢查題庫答案都背下來了所以單子上寫沒有異常' },
          { author: '點點（@dotnote）', text: '石原氏檢查表很有意思，有一種是故意設計成色覺正常和色盲的人會讀到不同數字的' }
        ]
      },
      {
        // 用途：指向「把個人資料的年齡改小」
        id: 'drawings',
        board: 'academic',
        title: '孩童畫作雜談',
        author: '安安老師（@an_draws）',
        date: '2026-09-18',
        blocks: [
          { type: 'p', text: '研究顯示，12 歲以下的孩童充滿想像力，總能畫出意想不到的東西。隨著年齡增長，這種現象會消失\n\n我在兒童畫室教了幾年，家長經常問「我孩子的天賦好嗎」。老實說我也不知道。年紀小的孩子畫人，手腳都是長長的橢圓形；畫房子，形狀隨心所欲；畫天空，不會局限於常見的顏色\n\n但是通常到了小學高年級，他們開始在意「畫得像不像」，大家的畫風就趨近寫實了\n我覺得畫畫是在展現自己的想法，以畫得是否正確來判定天賦不是個好主意' },
          { type: 'img', src: 'assets/horizon/drawing-napoleon.jpg', alt: '孩子用廣告顏料臨摹的拿破崙騎白馬，馬是白色的，拿破崙穿黃衣、戴藍帽，上方用注音寫著畫名，左下角寫著 BONAPARTE。', caption: '畫室學生的作品，臨摹〈拿破崙越過阿爾卑斯山〉' }
        ],
        comments: [
          { author: '還沒睡（@stillawake03）', text: '真的是想像力嗎....我總覺得他們看到的世界跟我們不一樣....' },
          { author: '阿凱（@kai_22）', text: '我想不起來小時候看東西的方法，難道被刪除了？？' },
          { author: '晴媽（@ching_0917）', text: '你們不要再陰謀論了啦！害我現在看到我家小孩對著角落笑就覺得毛毛的......' },
          { author: '點點（@dotnote）', text: '小孩畫的比例其實反映他們最在意的東西' },
          { author: '豆漿不加糖（@soy_0sugar）', text: '我小時候畫的太陽都有臉 ．＿．' },
          { author: '安安老師（@an_draws）', text: '最近有小朋友畫了一隻很像蝦子的怪物，說是在博物館看到的寒武紀動物，畫得比我還認真' }
        ]
      },
      {
        // 第一個謎題：用研究者的帳號和生日登入後才看得到。裡面的關鍵字指向其他謎題，之後會再增加
        id: 'notes',
        board: 'academic',
        title: '關於這個網站的幾個疑點',
        author: 'C.H.（@chhsu）',
        date: '2026-10-09',
        lock: { type: 'login', account: 'chhsu' },
        blocks: [
          // 這一段的本名和單位名稱是關鍵字：搜本名找到得獎新聞，搜單位名稱找到單位網站
          { type: 'p', text: '我是許至恆，在明域視覺科技研究中心做淚液和眼表的研究。目前為止我覺得有些地方不太對勁\n\n一、這個測驗的題目會混雜一些奇怪的問題。說不定是那種偷偷洗腦人的邪教製作的，\n\n二、站上的資料乍看都是正經的科普，但你們不覺得同好會放這種詞條很奇怪嗎？這些跟認知科學沒什麼關係吧，而且我隱隱約約覺得他們之間有什麼共通點' },
          { type: 'h', text: '預計的調查方向' },
          { type: 'p', text: '1. 以一個趣味測試來說，對個人資料的設定似乎限制太大了，甚至要填年齡，常玩這種測試的人都知道，光是要填暱稱就已經很多餘了\n\n2. 那些專業人士的貼文放在論壇實在有些莫名其妙，當然想放什麼內容是個人自由，但我覺得要嘛他們不懂得在適當的地方做適當的宣傳，要嘛就是他們想偷渡什麼概念\n\n3. 很多文章都在提到光和視覺什麼的，害我想起自己該回去補點研究進度了......剛好電子顯微鏡是用電子束成像，稍微遠離這些光光光的討論吧。中心的員工專區可以遠端操作一台，順便寫寫研究筆記\n\n最近大概用眼過度了，眼睛老是覺得乾乾的' }
        ],
        comments: []
      },

      // ===== 閒聊 =====
      {
        // 用途：暗示有人的測驗多了別人沒有的題目
        id: 'results',
        board: 'chat',
        title: '測驗結果討論串',
        author: '豆漿不加糖（@soy_0sugar）',
        date: '2026-10-30',
        blocks: [
          { type: 'p', text: '我是全景型的人！你們呢？' },
          // 用遊戲本身的結果卡畫的（豆漿不加糖、全景型、理智值 71、測驗日期和發文同一天）
          { type: 'img', src: 'assets/horizon/result-soy.jpg', alt: '視界認知小測驗的結果卡：理智值 71，全景型，受測者豆漿不加糖。' }
        ],
        comments: [
          { author: '阿凱（@kai_22）', text: '廣角型，理智值 60。描述感覺挺符合的，但我理智這麼低的嗎？？' },
          { author: '老林（@lin_1962）', text: '顯微型＋1，朋友說很準。' },
          { author: '晴媽（@ching_0917）', text: '快門型。理智值 100 😎' },
          { author: '還沒睡（@stillawake03）', text: '我的測驗題好像比我朋友還多，還有隱藏關卡？', replies: [
            { author: '豆漿不加糖（@soy_0sugar）', text: '真的假的，作者真用心' }
          ] },
          { author: '珍珠奶茶半糖（@boba_half）', text: '快門型＋1，理智值 85' },
          { author: '點點（@dotnote）', text: '全景型，描述蠻準的' },
          { author: '快樂宅宅（@cola_fat）', text: '我做到一半就沒耐心了' }
        ]
      },
      {
        // 用途：研究者越調查眼睛狀況越差；玩家也從這篇知道他的暱稱和帳號
        id: 'eyedrops',
        board: 'chat',
        title: '求眼藥水推薦',
        author: 'C.H.（@chhsu）',
        date: '2026-09-26',
        blocks: [
          { type: 'p', text: '最近眼睛很乾，還會刺痛，螢幕看久一點就開始模糊。有沒有推薦的人工淚液？不含防腐劑的優先' },
          { type: 'img', src: 'assets/horizon/eyedrops.jpg', alt: '夜裡的電腦桌，鍵盤旁邊放著六瓶人工淚液和幾支用過的單支裝，旁邊有眼鏡、揉皺的面紙和一杯喝剩的咖啡。', caption: '目前用過的。都沒什麼用' }
        ],
        comments: [
          { author: '豆漿不加糖（@soy_0sugar）', text: '老哥你也用太多了吧，少看點螢幕啦你，一天掛在論壇十幾個小時' },
          { author: '晴媽（@ching_0917）', text: '我覺得去看眼科比較實在', replies: [
            { author: 'C.H.（@chhsu）', text: '看過了，醫生說有點發炎，原因不明' }
          ] },
          { author: '阿凱（@kai_22）', text: '人工淚液不要點太多啦，單支裝開了也要當天用完' },
          { author: '還沒睡（@stillawake03）', text: '同病相憐，我也一天掛十幾個小時' }
        ]
      },
      {
        // 用途：給研究者的生日（＝登入密碼）。改帳號的 password 時，這裡的日期要一起改
        id: 'missing',
        board: 'chat',
        title: '有沒有人知道 C.H. 去哪了？',
        author: '阿凱（@kai_22）',
        date: '2026-11-03',
        blocks: [
          { type: 'p', text: '他不是重度網路使用者嗎？已經快一個月沒看到他發文了' }
        ],
        comments: [
          { author: '豆漿不加糖（@soy_0sugar）', text: '我也想問，本來還打算 11 月 20 號送他生日禮物呢' },
          { author: '老林（@lin_1962）', text: '大家不用擔心，他只是想先靜靜。' },
          { author: '晴媽（@ching_0917）', text: '會不會只是在忙研究' },
          { author: '還沒睡（@stillawake03）', text: '他上次說眼睛在發炎，希望沒事' }
        ]
      },
      {
        // 用途：支線，帶出搜尋詞「空想性錯視」
        id: 'faces',
        board: 'chat',
        title: '我總覺得最近經常看到人臉？',
        author: '還沒睡（@stillawake03）',
        date: '2026-11-07',
        blocks: [
          { type: 'p', text: '插座、天花板的污漬、窗簾的皺摺，最近看什麼都像臉。是我的問題嗎？' },
          { type: 'img', src: 'assets/horizon/face-stain.jpg', alt: '天花板角落的水漬，有兩塊深色的斑和一道弧線，看起來像一張臉。', caption: '我房間天花板。昨天晚上拍的' }
        ],
        comments: [
          { author: '點點（@dotnote）', text: '這叫做空想性錯視喔，你可以去查查看，挺有趣的', replies: [
            { author: '還沒睡（@stillawake03）', text: '查了，但我還是一直被嚇一跳....好吧，我大概累了' }
          ] },
          { author: '晴媽（@ching_0917）', text: '我也是！最近覺得家裡的插座都在對我笑' },
          {
            author: '珍珠奶茶半糖（@boba_half）',
            text: '我家貓也一直盯著牆角，這兩件事有關嗎',
            replies: [
              { author: '阿凱（@kai_22）', text: '沒有，去睡覺' }
            ]
          }
        ]
      },
      {
        // 【草稿】關鍵字「新聞」：玩家搜「新聞」會一次找到兩則主線新聞（得獎公告不算，要搜本名）。內文故意什麼都沒講
        id: 'news',
        board: 'chat',
        title: '你們有看最近的新聞嗎',
        author: '快樂宅宅（@cola_fat）',
        date: '2026-11-12',
        blocks: [
          { type: 'p', text: '懂得都懂，不懂的說了也不懂，你也別問，利益牽扯太大，說了對你們沒好處，我只能說水很深，網上的資料都刪了，所以我只能說懂得都懂，不懂也沒辦法' }
        ],
        comments: [
          { author: '阿凱（@kai_22）', text: '什麼新聞' },
          { author: '豆漿不加糖（@soy_0sugar）', text: '標題黨檢舉了' },
          {
            author: '還沒睡（@stillawake03）',
            text: '你倒是講啊',
            replies: [
              { author: '快樂宅宅（@cola_fat）', text: '自己查啦，站上就有' }
            ]
          },
          { author: '晴媽（@ching_0917）', text: '現在年輕人都這樣嗎' }
        ]
      },
      {
        // 【草稿】關鍵字「夜盲症」
        id: 'night',
        board: 'chat',
        title: '最近晚上好像看不太清楚',
        author: '晴媽（@ching_0917）',
        date: '2026-11-09',
        blocks: [
          { type: 'p', text: '這陣子晚上去接小孩，路燈照不到的地方幾乎看不到路，白天倒是還好\n\n是不是年紀到了啊，有沒有人也這樣' }
        ],
        comments: [
          { author: '健康小幫手（@health_4u）', text: '康視強效膠囊🌙 專為現代人設計，有效遠離夜盲症！現在下單買二送一，詳情請私訊小幫手👉' },
          { author: '阿凱（@kai_22）', text: '樓上廣告滾' },
          {
            author: '點點（@dotnote）',
            text: '晚上特別看不清楚可以查查夜盲症，維生素 A 不夠也會這樣，還是去看一下眼科比較保險',
            replies: [
              { author: '晴媽（@ching_0917）', text: '好，我週末帶小孩去打疫苗順便看' }
            ]
          },
          { author: '珍珠奶茶半糖（@boba_half）', text: '會不會是眼鏡度數不夠了，我上次換了眼鏡就好很多' }
        ]
      },
      {
        // 【草稿】許至恆（C.H.）的閒聊文，關鍵字「免疫豁免」「免疫系統」。時間在眼藥水那篇（9/26）和老林寫信（10/5）之間。老林在這裡第一次注意到他
        id: 'immune',
        board: 'chat',
        title: '你們知道眼睛被免疫系統發現會被攻擊嗎？',
        author: 'C.H.（@chhsu）',
        date: '2026-09-30',
        blocks: [
          {
            type: 'p',
            text: '最近眼睛發炎跑了好幾趟眼科，等看診的時候順便查了一些資料，發現一個有點毛的冷知識\n\n免疫系統本來是保護我們的，可是有時候會認錯人，自己打自己，像類風濕性關節炎、第一型糖尿病都是這種自體免疫疾病\n\n眼睛比較特別，它躲在一道屏障後面，免疫系統平常不太會去碰它，這叫免疫豁免。可是如果屏障破了，免疫系統一旦發現有眼睛這東西，就會開始攻擊，嚴重的話連另一隻好好的眼睛都會一起發炎\n\n不知道是眼睛在躲免疫系統，還是身體本來就不認得眼睛\n\n順便一提我就是做眼科研究的，所以比較常注意這種小知識'
          }
        ],
        comments: [
          { author: '豆漿不加糖（@soy_0sugar）', text: '酷喔' },
          {
            author: '阿凱（@kai_22）',
            text: '你的眼睛還好嗎，上次不是說發炎',
            replies: [
              { author: 'C.H.（@chhsu）', text: '還在點眼藥水，醫生說原因不明，先觀察' }
            ]
          },
          { author: '老林（@lin_1962）', text: '身體記得的事，比我們以為的多。' }
        ]
      },
      {
        // 【草稿】關鍵字「飛蚊症」
        id: 'floaters',
        board: 'chat',
        title: '揉眼睛後可以看到有東西在飛，我可能升級出陰陽眼了',
        author: '還沒睡（@stillawake03）',
        date: '2026-10-22',
        blocks: [
          { type: 'p', text: '熬夜打報告打到眼睛很痠，揉一揉張開之後，看到天花板有幾條透明的東西在飄，轉頭它也跟著轉\n\n我是不是終於打開陰陽眼了' }
        ],
        comments: [
          { author: '阿凱（@kai_22）', text: '樓主醒醒，這是飛蚊症' },
          { author: '豆漿不加糖（@soy_0sugar）', text: '每天都還沒睡難怪' },
          {
            author: '點點（@dotnote）',
            text: '飛蚊症大多是玻璃體退化造成的，如果突然變很多或看到閃光，要趕快去看眼科喔',
            replies: [
              { author: '還沒睡（@stillawake03）', text: '好吧，看來我只是普通的爆肝' }
            ]
          }
        ]
      },
      {
        // 【草稿】提到首頁的假廣告
        id: 'ad-game',
        board: 'chat',
        title: '首頁那個小人跑酷廣告到底怎麼過',
        author: '阿凱（@kai_22）',
        date: '2026-10-06',
        blocks: [
          { type: 'p', text: '每次待在首頁就從角落跳出來，點進去玩，結果一撞到那個紫色的圈圈就直接 404\n\n那個關卡是什麼鬼，朋友想問哪裡可以下載' }
        ],
        comments: [
          { author: '豆漿不加糖（@soy_0sugar）', text: '你居然真的去玩' },
          { author: '還沒睡（@stillawake03）', text: '我這邊跳的是阿嬤那個，什麼爛遊戲' },
          { author: 'C.H.（@chhsu）', text: '那個朋友是不是你自己' },
          {
            author: '晴媽（@ching_0917）',
            text: '這種廣告不要亂點啦，等等中毒',
            replies: [
              { author: '阿凱（@kai_22）', text: '就很好奇嘛' }
            ]
          }
        ]
      },
      {
        id: 'cat',
        board: 'chat',
        title: '我家貓最近一直盯著牆角',
        author: '珍珠奶茶半糖（@boba_half）',
        date: '2026-10-28',
        blocks: [
          { type: 'p', text: '晚上關燈之後牠就坐在那邊，盯著同一個角落看很久，叫牠也不理\n\n白天就很正常，是不是有蟲' }
        ],
        comments: [
          { author: '晴媽（@ching_0917）', text: '貓都這樣啦，牠們聽得到我們聽不到的聲音' },
          { author: '還沒睡（@stillawake03）', text: '不要再說了我也有養貓' },
          {
            author: '阿凱（@kai_22）',
            text: '拍照看看有沒有東西',
            replies: [
              { author: '珍珠奶茶半糖（@boba_half）', text: '拍了，什麼都沒有' }
            ]
          }
        ]
      },
      {
        id: 'cafe',
        board: 'chat',
        title: '霧澄有推薦安靜可以讀書的咖啡廳嗎',
        author: '豆漿不加糖（@soy_0sugar）',
        date: '2026-10-18',
        blocks: [
          { type: 'p', text: '期中要到了，家裡太吵\n\n最好有插座、不限時，不要那種一直放音樂的' }
        ],
        comments: [
          { author: '還沒睡（@stillawake03）', text: '明域路那間轉角的不錯，旁邊就是一個研究中心，很安靜' },
          { author: '阿凱（@kai_22）', text: '去圖書館啦' },
          { author: '珍珠奶茶半糖（@boba_half）', text: '樓上推的那間我去過，珍奶很普通但很好讀書' }
        ]
      },
      {
        // 【草稿】和認知科學無關的「專業人士」貼文：許至恆的上鎖文章有吐槽這種貼文
        id: 'admission',
        board: 'academic',
        title: '霧澄大學視光學系 招生說明',
        author: '王老師（@prof_wang）',
        date: '2026-10-12',
        blocks: [
          { type: 'p', text: '各位同好們好，我是霧澄大學視光學系的王老師。看到這裡有很多對視覺有興趣的朋友，特別來和大家分享。\n\n本系培養驗光、隱形眼鏡、低視能輔具等專業人才，畢業後可以報考驗光師證照，近年就業率相當高。今年 12 月有招生說明會，歡迎高中生和家長來參觀實驗室。\n\n有任何問題都可以留言或私訊我。' }
        ],
        comments: [
          { author: '豆漿不加糖（@soy_0sugar）', text: '這跟認知科學有關嗎' },
          { author: '阿凱（@kai_22）', text: '又是招生文' },
          {
            author: '晴媽（@ching_0917）',
            text: '請問說明會要先報名嗎',
            replies: [
              { author: '王老師（@prof_wang）', text: '不用報名，直接來就可以了，歡迎。', replies: [
                { author: '阿凱（@kai_22）', text: '你家小孩不是才剛上小學嗎' }
              ] }
            ]
          },
          { author: '張同學（@zhang_student）', text: '不如中國醫藥大學醫工系', replies: [
            { author: '中醫大醫工系主任（@cmu_bme_chair）', text: '同學不要戰科系' }
          ] }
        ]
      },
      {
        id: 'cat-water',
        board: 'academic',
        title: '貓喝水的物理學：舌頭其實沒有在舀水',
        author: '點點（@dotnote）',
        date: '2026-09-10',
        blocks: [
          { type: 'p', text: '很多人以為貓喝水是把舌頭捲成湯匙舀水，其實不是。高速攝影發現，貓只用舌尖輕輕碰一下水面，再快速往上抽，水被慣性拉成一根小水柱，貓在水柱掉下來之前把嘴巴闔上\n\n一秒大約重複四次，舌頭抽起來的速度剛好讓重力和慣性互相抵消，喝到的水最多。狗就沒有這麼優雅了，牠們真的是用舌頭往後捲著舀' }
        ],
        comments: [
          { author: '豆漿不加糖（@soy_0sugar）', text: '這跟認知科學有關嗎' },
          { author: '珍珠奶茶半糖（@boba_half）', text: '我家貓喝水都噴得到處都是，是比較笨嗎' }
        ]
      },
      {
        id: 'microwave',
        board: 'academic',
        title: '微波爐裡放金屬為什麼會冒火花',
        author: '路過的理組（@sci_lover）',
        date: '2026-10-03',
        blocks: [
          { type: 'p', text: '微波爐的微波會讓金屬表面的電子跑來跑去。平滑的大碗通常沒事，但叉子、鋁箔邊緣、碗上的金邊這種尖尖的地方，電荷會集中在一起，電場強到讓空氣被擊穿，就變成火花\n\n所以不是「金屬不能微波」，而是「有尖角或很薄的金屬」比較危險。但為了安全，還是不要拿你阿嬤的鐵碗做實驗' }
        ],
        comments: [
          { author: '豆漿不加糖（@soy_0sugar）', text: '這跟認知科學有關嗎（問到不想問了）' },
          {
            author: '阿凱（@kai_22）',
            text: '我阿嬤每次都用鐵碗微波，到現在都沒事',
            replies: [
              { author: '路過的理組（@sci_lover）', text: '你阿嬤運氣很好' }
            ]
          }
        ]
      },
      {
        id: 'typhoon',
        board: 'academic',
        title: '颱風路徑為什麼每家預報都不一樣',
        author: '路過的理組（@sci_lover）',
        date: '2026-11-01',
        blocks: [
          { type: 'p', text: '每個氣象單位用的數值模式不同，初始資料也有一點點差異，大氣又是對初始條件很敏感的系統，所以幾天後的預報可能差異很大\n\n現在常用「系集預報」：同一個模式跑好幾十次，每次把初始條件稍微改一點，看結果集中在哪裡。路徑圖上那一大片扇形，就是這些結果的範圍' }
        ],
        comments: [
          { author: '還沒睡（@stillawake03）', text: '我想放颱風假' },
          { author: '豆漿不加糖（@soy_0sugar）', text: '這也跟認知科學沒關係吧' },
          { author: '晴媽（@ching_0917）', text: '看了半天還是不知道要不要收衣服' }
        ]
      },
      {
        id: 'no-sleep',
        board: 'academic',
        title: '睡眠不足真的會讓人看到不存在的東西嗎',
        author: '點點（@dotnote）',
        date: '2026-11-04',
        blocks: [
          { type: 'p', text: '會的。研究發現，連續清醒超過一兩天的人，有不少會出現知覺扭曲，例如覺得牆壁在動、眼角餘光看到東西閃過，嚴重的甚至會出現幻覺\n\n一般認為是大腦太累，處理感覺訊號時開始出錯，把雜訊當成有意義的東西。所以看到怪東西的時候，先檢查一下自己睡了幾個小時' }
        ],
        comments: [
          { author: '還沒睡（@stillawake03）', text: '你是不是在說我' },
          { author: '阿凱（@kai_22）', text: '我昨天睡四小時，今天看螢幕的字一直在跳' },
          { author: '豆漿不加糖（@soy_0sugar）', text: '這篇終於跟認知科學有關了' }
        ]
      }
    ]
  },

  /* ----------------------------------------------------------
   * lab：研究單位網站（lab/index.html）與模擬 SEM（lab/sem.html）
   * ----------------------------------------------------------
   * 定位（和視界要分開）：視界是輕鬆的科普測驗站，立場是「你看到的怪東西都是錯覺」；
   * 這個單位是 1987 年成立的研究機構（2026-11-17 從民間學會改成），研發低視能輔具、研究淚液與眼表，
   *   另外保存一份「非典型視覺經驗」的通報資料庫，立場是「大部分是錯覺，但有一小部分不是」；
   * 教團（cult）是從中心的關懷小組分出去的，立場是「那是真的，而且是好的」。
   * pages：公開頁面（關於本中心、視覺經驗紀錄、通訊、合作與聯絡），顯示在頁首下方的導覽列。每頁 { id, title, blocks }，blocks 由上到下：
   *        { type: 'h' | 'p', text }、{ type: 'ul', items: [...] }、{ type: 'table', head: [...], rows: [[...], ...] }
   * nav：導覽列上「首頁」的字。
   * docs：內部文件，登入後用頁首的搜尋框才搜得到（關鍵字要完全打對）。每份 { id, keywords, title, blocks }，blocks 和 pages 一樣。
   *       和教團的文件是同一條階梯的另一半：通訊第 26 期未公開稿 → 2009 年董事會紀錄。
   *       blocks 裡可以放 { type: 'file', id } 連到 files 裡的加密文件。
   *
   * 這是研究員隸屬單位的網站。流程：論壇上鎖文章給本名和單位名稱 → 站內搜尋本名找到得獎新聞（照片裡有工號）
   * → 站內搜尋單位名稱找到這個網站 → 用姓名和工號登入 → 員工專區的遠端影像系統（模擬 SEM，研究筆記就在儀器旁邊）。
   *
   * members：可以登入的成員 { id 代號, name 姓名, staffId 工號 }。姓名要出現在論壇上鎖文章和得獎新聞的關鍵字裡（tests/check.js 會檢查）。
   * login：登入表單與成員區的文字。
   * files：加密文件，每份 { id, title, hint 提示文字, hintBraille 點字寫的密碼提示, code 密碼, event 解開後記下的事件代號, paragraphs 內文 }
   *        員工專區選單上沒有，要從內部文件裡的 { type: 'file', id } 連過去（例如陳學仁醫師底下的陳醫師格言）。
   *        hintBraille 要用英文字母的點字拼出 code（tests/check.js 會檢查），玩家靠論壇那篇點字入門的對照表翻譯。
   * fileTexts：加密文件頁的介面文字。
   * chat：成員區的聊天紀錄（只能看）。messages 每則 { me: true 是研究員說的／不填是對方說的, text }。這裡提示玩家去調暗螢幕。
   * dim：玩家把裝置切成深色模式、而且已經登入時，首頁整個變黑、中間浮現的那行字 text（進教團網站的暗號的前半句；後半句是 files 裡陳醫師格言的內文）。網頁讀不到螢幕亮度，所以用深色模式代替「調暗」。
   * search：頁首右上角的站內搜尋，每一頁都有，要先登入才能用（needLogin）。搜得到 docs 裡的內部文件；查不到顯示 empty；輸入 code 就前往 href，並記下事件 event。
   *         code 是兩句暗號接起來：dim.text 在前、陳醫師格言（files 的 maxim）在後（tests/check.js 會檢查）。標點和空白會被忽略。
   * notes：研究筆記。entries 每則 { title, paragraphs: [一段一段的文字], photo（選填）: { src, alt, caption } }
   *        photo.src 是相對 lab/ 資料夾的路徑。照片資訊列上的倍率和 WD，就是玩家在 SEM 要調的數值。
   *
   * 研究單位網站和模擬 SEM 也會套用眼疾效果（2026-11-14 改）。
   *
   * home.equipment：設備表，每列 cells 是三格文字；填了 link，第一格就會變成連結。
   *
   * sem 的數值：
   *   magMin／magMax   顯示倍率範圍　　maxScale  畫面最多放大幾倍
   *   lockMag  進入時的倍率。拍到第一張照片之前，倍率不能調到比這個低
   *   startFocus      進入時的對焦值　surfaceFocus  樣品表面清楚時的對焦值（0~100）
   *   focusTolerance  對焦值差多少以內算對準　blurPerUnit／maxBlur  沒對準時的模糊程度與上限
   *   scanMs          擷取影像的掃描時間（毫秒）　surface  樣品表面：image 底圖；沒填 image 時用程式產生晶粒（影像大小、亂數種子、晶粒大小）
   *   zoomStep／wheelStep  ＋－按鈕與鍵盤、滾輪每次調整的倍率進度（0~1）　panStep  方向鍵每次移動的畫面比例（放大後會再除以縮放倍數）
   *   eye             照片全部拍齊後，在最低倍率繼續縮小會浮現一隻眼睛（夢核風格：真實照片只留眼型、黑白、半透明）：
   *                   image 眼睛照片（來源見企劃書）、size 照片的寬高、outline 眼型的裁切線（SVG 路徑，座標對應 size；換照片要重畫）、
   *                   opacity 最濃時的不透明度、step 每次縮多少（0~1）、minScale 樣品最後縮到多小、fieldKm 最後比例尺對應的畫面寬度（公里）、
   *                   lines 眼睛完全露出時的紅字，一行一行出現、排成階梯、lineDelay 每行間隔幾毫秒、lost 連線中斷的文字、lostDelay 幾毫秒後中斷
   *   dummyControls   擺設用的參數 { name, value }：看起來能調，點了只會顯示「此功能無響應」。value 是顯示的數字，各填各的才像真的儀器
   *
   * sem.clues：線索（標記區域），每個欄位：
   *   id      線索代號，例如 'c1'，不可重複，上線後不要改
   *   x, y    標記中心在樣品表面上的位置，0~1（左上角是 0,0）
   *   size    標記區域邊長，相對樣品寬度（0.05＝樣品寬度的 5%）
   *   photo   放大後顯示的照片（路徑相對 lab/ 資料夾）。寬至少 1600px、4:3，先裁掉原始照片的資訊列
   *   minMag  至少放大到幾倍才拍得到。必須大到照片已完全浮現（tests/check.js 會檢查）
   *   focus   這張照片清楚時的對焦值（0~100）
   *   color   低倍率時標記框的顏色
   *   label   相簿裡的說明文字
   */
  lab: {
    unitName: '明域視覺科技研究中心',
    unitNameShort: '明域視覺',
    backToMain: '← 回視界同好會', // 頁首的連結，方便跳回視界網站
    // 姓名與工號已定案（2026-11-16）。工號要和得獎新聞照片裡識別證上的一樣
    members: [
      { id: 'xu', name: '許至恆', staffId: 'VR-2291' }
    ],
    home: {
      // 首頁照片（選填）：photo: { src（相對於 lab/）, alt, caption }。2026-11-17 拿掉舊辦公室那張，正式機構不會在首頁放那麼舊的照片
      // 2026-11-21 改版：首頁最上面是主視覺，tagline 是大標語，intro 接在下面，cta 是連到第一個公開頁面（關於本中心）的按鈕
      tagline: '讓每一雙眼睛\n都看得更清楚', // 換行會照打的位置斷
      cta: '認識本中心',
      intro: '本中心成立於 1987 年，最初以研發低視能者使用的視覺輔具為核心業務，致力於透過光學設計與輔具改良，協助弱視及視障族群提升日常閱讀與生活品質。\n\n絕大多數都能在現有的眼科醫學與認知心理學框架下找到合理解釋，例如視覺疲勞、光學折射、視網膜殘影，或是眼疾本身引發的視野缺損。我們相信，輔具能夠幫助人們解決這些問題。\n\n隨著研究規模擴大，我們也逐步跨足基礎醫學領域，長期進行淚液成分、角膜代謝與眼表微環境的臨床觀察。',
      equipmentTitle: '研究資源',
      // 研究資源排成卡片：每一項的 cells 依序是名稱、來源、說明
      equipment: [
        { cells: ['遠端影像系統（掃描式電子顯微鏡）', '本中心材料實驗室', '限研究人員使用，請由員工專區進入'] },
        { cells: ['視覺現象資料庫', '本中心自建', '1987 年至今，累計 2,300 餘筆'] },
        { cells: ['《明域通訊》', '本中心出版', '年刊，寄送合作單位與捐款人'] }
      ],
      newsTitle: '最新消息',
      news: [
        { date: '2026-11-02', text: '十一月的輔具試用日改至第三個星期六，地點在本中心一樓' }, // 詳細地址在「關於本中心」
        { date: '2026-10-21', text: '遠端影像系統例行維護完成' },
        { date: '2026-09-12', text: '第 36 期《明域通訊》已寄出，未收到的合作單位請與行政室聯絡' },
        { date: '2026-05-20', text: '本中心研究員許至恆獲生醫工程學術成果獎' }
      ],
      footer: '© 明域視覺科技研究中心',
      // 頁底第二行。區碼後面接 0 開頭的號碼在台灣不會核發，確保打不到真的人
      phone: '聯絡電話　(05) 0128-7000'
    },
    nav: { home: '首頁', staff: '員工專區' }, // staff：導覽列最右邊，員工登入在那一頁
    pages: [
      {
        id: 'about',
        title: '關於本中心',
        blocks: [
          { type: 'h', text: '緣起' },
          { type: 'p', text: '1987 年，陳學仁醫師和幾位光學工程師，借用醫院的舊宿舍成立本中心。\n\n陳醫師退休後，決定投身研究領域，早期研發放大鏡和望遠式眼鏡，現今則是往創新輔具持續邁進。' },
          { type: 'img', src: '../assets/society/founding-1987.jpg', alt: '七個人站在一棟舊建築門口的合照，有人帶著望遠鏡和腳架。', caption: '成立當日合影，1987 年 10 月' },
          { type: 'img', src: '../assets/society/building.jpg', alt: '一棟四層樓的白色現代建築，立面是整排細長的白色遮陽板和大片玻璃，一樓是挑高的玻璃大廳，門口種著幾棵行道樹，街角是一般的台灣街景。', caption: '本中心現址' },
          { type: 'h', text: '我們做什麼' },
          { type: 'ul', items: [
            '輔具研發：放大、望遠與電子助視器，提供低視能者免費試用',
            '淚液與眼表研究：以電子顯微鏡觀察淚液乾燥後的結晶',
            '視覺現象紀錄：受理通報，由兩名以上研究人員訪談、建檔，依序排除已知的錯覺、光學與生理因素',
            '年度彙整：每年出版一期《明域通訊》，公開當年度的研究成果與統計'
          ] },
          { type: 'img', src: '../assets/society/interview.jpg', alt: '兩名研究人員背對鏡頭坐在塑膠凳上，訪談一位坐在藤椅上的老先生，一人拿著錄音機，一人做筆記。', caption: '視覺現象訪談。為保護當事人，本中心公開的照片不呈現受訪者的面部' },
          { type: 'h', text: '注意事項' },
          { type: 'p', text: '本中心不提供醫療診斷，不替任何宗教或靈性主張背書，也不接受以「證明某種存在」為前提的委託。' },
          { type: 'h', text: '沿革' },
          { type: 'table', head: ['年份', '事項'], rows: [
            ['1987', '本中心成立，首任主任為退休眼科醫師'],
            ['1991', '《明域通訊》創刊'],
            ['1996', '成立關懷小組，陪伴視力受損而受困擾的當事人與家屬'],
            ['2004', '視覺現象資料庫電子化'],
            ['2009', '關懷小組改以團契形式獨立運作，不再列入本中心編制'],
            ['2019', '材料實驗室購置掃描式電子顯微鏡，開放研究人員遠端操作'],
            ['2026', '本中心研究員獲生醫工程學術成果獎']
          ] },
          { type: 'h', text: '組織' },
          { type: 'p', text: '本中心為財團法人，設董事九人、監察人三人。現有研究與技術人員約 40 人，經費來自政府委託計畫、輔具銷售與民間捐款。' },
          { type: 'h', text: '地址' },
          { type: 'p', text: '霧澄市明域路 128 號' } // 霧澄市、明域路都是虛構地名
        ]
      },
      {
        id: 'cases',
        title: '視覺現象紀錄',
        blocks: [
          { type: 'p', text: '由陳學仁醫師創立本資料庫，自 1987 年起累計建檔 2,300 餘筆，來源包括門診患者、輔具使用者與民眾通報。為保護當事人，公開版本只列出年份、地區與分類，完整紀錄僅供研究人員查閱。' },
          { type: 'img', src: '../assets/society/archive.jpg', alt: '堆滿鐵櫃和紙箱的資料室，其中一個抽屜開著。', caption: '本中心資料室。2004 年電子化以前的紙本紀錄仍保存於此' },
          { type: 'h', text: '分類' },
          { type: 'ul', items: [
            'A 類：已找到解釋（約占 81%）',
            'B 類：資料不足，無法判斷（約占 15%）',
            'C 類：資料充足，但目前無法解釋（約占 4%）'
          ] },
          { type: 'h', text: '個案摘要' },
          { type: 'table', head: ['編號', '年份', '地區', '摘要', '分類'], rows: [
            ['87-014', '1987', '北部山區', '登山隊七人同時看見不符合星象圖的星空', 'C'],
            ['93-102', '1993', '中部沿海', '數名漁民描述海面上有不明亮點，但轉頭直視就會消失', 'B'],
            ['02-037', '2002', '東部', '一名幼兒連續數週對著同一面牆說話。家長拍攝的照片沒有異狀', 'B'],
            ['11-208', '2011', '南部市區', '夜班護理人員在走廊盡頭看見人形輪廓。經現地勘查，為玻璃反射', 'A'],
            ['19-055', '2019', '北部市區', '水晶體摘除手術後的患者表示，術後數日「看到了奇妙的東西」（患者表示描述不出來）', 'B'],
            ['24-131', '2024', '中部山區', '三名互不相識的受訪者，分別畫出幾乎相同的圖形', 'C']
          ] },
          { type: 'img', src: '../assets/society/ridge.jpg', alt: '黃昏的稜線上有一排很小的人影，隊伍前方不遠處有一個比較高、比較細的黑影。', caption: '個案 87-014。山腳下休息的登山客所提供的底片翻拍' },
          { type: 'img', src: '../assets/society/three-drawings.jpg', alt: '三張並排的紙，各用鉛筆畫了一圈小方塊，筆跡明顯不同。', caption: '個案 24-131。三位受訪者各自畫下的圖形' },
          { type: 'p', text: '如果你有類似的經驗，歡迎與本中心聯絡' }
        ]
      },
      {
        id: 'journal',
        title: '通訊',
        blocks: [
          { type: 'p', text: '《明域通訊》為年刊，1991 年創刊，寄送合作單位與捐款人。以下為部分期別的專題。' },
          { type: 'img', src: '../assets/society/journal-cover.jpg', alt: '一本泛黃的薄冊子封面，上方印著暗紅色的記號：圓裡一條橫線，橫線上方一個實心的點。', caption: '創刊號封面，1991 年。封面上的記號沿用至今',
            overlay: ['明域通訊', '創刊號', '一九九一年'] }, // 疊在封面圖上的字，第一行是書名
          { type: 'table', head: ['期別', '年份', '專題'], rows: [
            ['第 36 期', '2026', '不靠光的影像：電子顯微鏡能告訴我們什麼'],
            ['第 35 期', '2025', '孩子眼中的世界'],
            ['第 34 期', '2024', '異常現象目擊的四十年紀錄'],
            ['第 33 期', '2023', '手術之後：水晶體摘除患者的口述'],
            ['第 26 期', '2016', '關懷小組二十年回顧（本期未公開）']
          ] }
        ]
      },
      {
        id: 'join',
        title: '合作與聯絡',
        blocks: [
          { type: 'ul', items: [
            '輔具試用：低視能者與家屬可預約到本中心免費試用助視器',
            '受試者招募：本中心不定期招募研究受試者，消息公布於首頁',
            '視覺現象通報：如果你看見了無法解釋的東西，歡迎來信，我們會派人與你聯絡'
          ] },
          { type: 'h', text: '員工專區' },
          { type: 'p', text: '員工專區以本名登入，密碼為工號。工號印在本中心核發的識別證上，遺失請洽行政室補發。' },
          { type: 'h', text: '聯絡' },
          { type: 'p', text: '來信請寄本中心行政室，約一週內回覆。' }
        ]
      }
    ],
    docs: [
      {
        // 【草稿】創辦人的人物介紹。名字在「關於本中心」和「視覺經驗紀錄」都看得到。
        // 他其實也是闔目團契的創始人（關懷小組就是他發起的），這裡不明講，只留晚年視力減退、每週去小組這兩點。
        // 最下面掛加密文件「陳醫師格言」（files 的 maxim），內文是進教團網站的暗號後半句
        id: 'chen',
        keywords: ['陳學仁'],
        title: '人物介紹：陳學仁醫師',
        blocks: [
          { type: 'img', src: '../assets/society/chen.jpg', alt: '戴深色粗框眼鏡的白髮老先生，穿白襯衫、打深藍色領帶，在灰藍色布幕前微笑的半身照。', caption: '陳學仁醫師，攝於 1990 年代' },
          { type: 'p', text: '陳學仁醫師，眼科專科醫師，本中心創辦人。在南部執業三十餘年，1987 年自診所退休後，與幾位光學工程師借用醫院舊宿舍成立本中心，擔任首任主任。' },
          { type: 'p', text: '任內建立視覺現象資料庫，早期的訪談多由他親自參與。1996 年發起關懷小組，陪伴視力受損的受訪者與家屬。\n\n晚年雙眼視力逐漸減退，卸任後仍維持每週到關懷小組的習慣。' },
          { type: 'h', text: '遺稿' },
          { type: 'p', text: '陳醫師生前留下的手稿由行政室整理保存，部分檔案依其遺願加密。' },
          { type: 'file', id: 'maxim' }
        ]
      },
      // ---- 眼睛線：兩份都用 OPHANIM 搜（lab.semLog 畫出來的詞）。這條線要讓眼睛看起來也有陰謀 ----
      {
        // 中世紀畫作：只放一張圖和一張翻譯筆記，不加說明，讓玩家自己看。
        // 圖上頁緣那行拉丁文 oculi non sunt nostri（眼睛不是我們的）是研究日記（diary）的密碼。
        // 抄本裡的 s 寫成長 s（ſ），看起來像 f。第二張圖是作者親手寫的紙條（原檔：圖片原檔/筆記.png），只有三行「長 s 的寫法 → 英文」，
        // 紙條上的長 s 都沒有橫槓，讓玩家自己分出 s 和 f。沒有明講，也不給整句的翻譯
        id: 'wheel-painting',
        keywords: ['OPHANIM'],
        title: '影像檔案：抄本插圖（約十二世紀）',
        blocks: [
          { type: 'img', src: '../assets/society/wheel-painting.jpg', alt: '攤開的古抄本頁面，畫著層層套疊的輪子，輪圈上排滿中央有一點的小方格，正中央是空的。下緣一排仰頭的小人，臉上沒有畫眼睛。右側頁緣有一行手寫的拉丁文。', caption: '翻拍照片，1994 年' },
          { type: 'img', src: '../assets/society/latin-notes.jpg', alt: '一張白紙，手寫了三行：三個以長 s 書寫的拉丁文字，各用箭頭指向對應的英文字和中文意思。', caption: '夾在同一個檔案夾裡的筆記' }
        ]
      },
      {
        // 【草稿】鄉野怪談的調查報導。山村傳說「眼睛是寄來的」，後山的石頭上刻著一圈方格，村人叫它「輪仔」。
        // 三條禁忌各對應一個既有線索：不點燈（光是糧食）、三歲以前的孩子（年齡那一題）、用布蓋眼（教團的面紗）。
        // 架構：緣由 → 傳說 → 三條禁忌 → 一則說不通的事 → 現地勘查（不下結論，讓玩家自己想）
        id: 'borrowed-eyes',
        keywords: ['OPHANIM'],
        title: '田野報告：「借目」——中部山村的一則傳說（1989）',
        stamp: '未刊',
        blocks: [
          { type: 'p', text: '1989 年夏天，本中心兩名研究人員隨醫院到中部山區做偏鄉視力篩檢。篩檢期間，村裡的老人反覆提到一句話：「目睭是借來的。」以下是兩人當時抄錄的村中古籍內容。' },
          { type: 'h', text: '傳說' },
          { type: 'p', text: '昔天降火，墜於後山。故老相傳，未墜之先，人不知視；既墜之後，所生者始見。\n\n雙目乃彼時寄於人身，人各一對。生則假之以用，歿則歸還。' },
          { type: 'h', text: '三條禁忌' },
          { type: 'ul', items: [
            '既暮，不可燃燈',
            '稚子未滿三歲，若對空而言，長者切莫問其所見',
            '凡人歿，入殮之先，必以黑布覆其雙目，鄉人謂之「還目」'
          ] },
          { type: 'h', text: '民初怪事' },
          { type: 'p', text: '有老婦年逾七旬，言其夫歿之夜，覆目之布滑落。婦記之甚明，夫氣絕時雙目猶張，屢闔之而不能閉。及翌晨，見布墜於地，其目已瞑。\n\n是歲，村中生一子。鄉人云，此子未嘗對空而言。' },
          { type: 'h', text: '現地勘查' },
          { type: 'p', text: '後山有一塊半埋在土裡的深色石頭，表面有方塊形成圓圈的凹痕，圓圈中央平滑。村裡沒有人知道是誰刻的，老人們稱呼它為「輪仔」。' }
        ]
      },
      {
        // 【草稿】研究員的私人日記，接在研究筆記（lab.notes，到 10 月 8 日）之後。
        // 在研究中心的搜尋框搜他的本名就找得到，但上了鎖：密碼是抄本頁緣那句拉丁文
        // （空格、大小寫都不計較；照抄本打長 s「ſ」也算對）。所以玩家可能很早就搜到、卻要等到眼睛線走完才打得開。
        // 內容：他解開的三份密文（能量紀錄的 OPHANIM、頁緣的長 s、點字的 veil）→ 他拼出來的眼睛的真相 → 兩種讀法 → 起霧。
        // 刻意不替眼睛下結論（保護還是囚禁，兩種讀法都留著），真相在結局才說。最後一天只有十行「都是真的」
        id: 'diary',
        keywords: ['許至恆'],
        code: 'oculi non sunt nostri',
        event: 'eye-diary',
        hint: '提示：頁緣。',
        title: '許至恆的日記',
        blocks: [
          { type: 'h', text: '10 月 9 日' },
          { type: 'p', text: '昨天拍攝新影像的時候，系統在斷線前存下了偵測器的紀錄。強度對能量的散佈圖竟然跑出一個字：OPHANIM。哪個人對我的系統惡作劇......' },
          { type: 'h', text: '10 月 11 日' },
          { type: 'p', text: '用那個字搜中心的檔案庫，跳出兩份我從來沒看過的舊檔：一份 1994 年翻拍的抄本，一份 1989 年沒有刊出的田野報告\n\n抄本上輪圈的方塊，好像和我樣品上的立方體長的很像，是我的錯覺嗎，也許我做研究到走火入魔了\n\n頁緣上寫的那行字，oculi non sunt nostri，眼睛不是我們的......？' },
          { type: 'h', text: '10 月 13 日' },
          { type: 'p', text: '昔天降火，墜於後山\n\n聽起來像隕石。說到隕石，之前看到新聞說五億四千萬年前有隕石掉落。剛好在那個時間點動物開始演化出類似眼睛的構造。巧合嗎？' },
          { type: 'h', text: '10 月 15 日' },
          { type: 'p', text: '老林說去找找陳醫師的格言，居然還得解密碼，還好在論壇看到過' },
          { type: 'h', text: '10 月 17 日' },
          { type: 'p', text: '所以按照我的推理' },
          { type: 'ul', items: [
            '他們不是長出來的，是寄住的',
            '他們靠光生存',
            '他們改變了我們原本能看到的景象',
            '有個我們看不到的世界「原貌」'
          ] },
          { type: 'p', text: '簡直科幻小說' },
          { type: 'h', text: '10 月 19 日' },
          { type: 'p', text: '我不太確定是哪一種\n\n他們在保護我們，外面那些東西不能看\n\n他們在約束我們，我們應該有生活於真實的權利' },
          { type: 'h', text: '10 月 21 日' },
          { type: 'p', text: '右眼感覺霧霧的。早上看螢幕像隔著一層紗，下午好一點。醫生說是白內障，居然年紀輕輕就得\n\n但我總覺得除了霧霧的好像還有其他症狀' },
          { type: 'h', text: '10 月 24 日' },
          // 只寫這一句，十行
          { type: 'p', text: '都是真的\n\n都是真的\n\n都是真的\n\n都是真的\n\n都是真的\n\n都是真的\n\n都是真的\n\n都是真的\n\n都是真的\n\n都是真的' }
        ]
      },
      {
        // 「通訊」頁寫著第 26 期未公開，玩家拿「第 26 期」來搜。結尾帶出「董事會紀錄」。
        // 最後一段刻意讓兩種說法並存：眼睛是在擋住那些東西，還是在招來那些東西
        id: 'issue28',
        keywords: ['第26期', '第二十六期', '關懷小組二十年回顧'],
        title: '《明域通訊》第 26 期未公開稿：關懷小組二十年回顧',
        stamp: '不予刊出', // 蓋在標題下面的印章（選填）
        blocks: [
          { type: 'p', text: '本文原定刊於 2016 年第 26 期，經董事會決議不予刊出。以下為送審稿的摘要。' },
          { type: 'h', text: '統計' },
          { type: 'table', head: ['項目', '關懷小組成員', '一般輔具使用者'], rows: [
            ['追蹤人數', '46', '212'],
            ['十年內視力明顯減退', '31（67%）', '19（9%）'],
            ['十年內失明', '14（30%）', '1（不到 1%）']
          ] },
          { type: 'p', text: '小組成員視力減退的比例遠高於一般輔具使用者。筆者無法判斷這是因為視力受損的人比較容易加入小組，還是加入之後才開始減退。然而受訪的成員沒有人表示後悔。有幾位說，看不見之後，終於能接近他們了。他們是誰，成員們沒有細講，也許是其他視力受損的民眾。\n\n相關討論見 2009 年第三次董事會紀錄。' }
        ]
      },
      {
        // 這裡第一次有人說出「免疫系統在攻擊眼睛」。名冊移交給小組，帶出教團那邊的「名冊」
        id: 'minutes2009',
        keywords: ['董事會紀錄', '第三次董事會紀錄', '2009年第三次董事會紀錄'],
        title: '2009 年第三次董事會紀錄（節錄）',
        blocks: [
          { type: 'p', text: '出席董事八人，監察人二人。' },
          { type: 'img', src: '../assets/society/meeting-2009.jpg', alt: '一群人圍著長桌開會，桌子最遠的那一端有一張空椅子，椅背上掛著外套。', caption: '會議當日。攝於表決之後' },
          { type: 'h', text: '討論事項：關懷小組的定位' },
          { type: 'p', text: '甲董事：小組近年的活動已經偏離陪伴的初衷。熄燈、點字、把失明的成員稱為使者，我們並不是宗教團體。\n\n乙董事：他們沒有強迫任何人，而且那些人比來找我們的時候平靜得多。\n\n甲董事：平靜不是我們衡量的標準，而且甚至有成員拒絕治療。\n\n乙董事：也有成員治療了依舊還是失明，醫生找不到原因。想找到心靈寄託也是情有可原\n\n丙董事（眼科）：就我看過的幾位，免疫系統在攻擊自己的眼睛這個現象，竟然集中出現在同一群人身上，我覺得需要調查原因。' },
          { type: 'h', text: '決議' },
          { type: 'p', text: '關懷小組自即日起不再列入本中心編制，名冊移交小組自行保管。表決結果：六票贊成，一票反對，一票棄權。\n\n乙董事於會後辭去董事職務。' }
        ]
      }
    ],
    login: {
      title: '員工登入',
      nameLabel: '姓名',
      idLabel: '工號',
      button: '登入',
      failed: '姓名或工號錯誤。',
      hello: '{name}，歡迎回來。',
      semLink: '遠端影像系統', // 員工專區選單第一項。研究筆記放在儀器旁邊
      logout: '登出',
      needLogin: '此頁面僅供本中心員工使用，請先登入。',
      toStaff: '回到員工專區'
    },
    // 員工專區（#staff）做成真的內部系統：登入前是登入頁，登入後是入口網首頁。
    // 研究筆記、訊息、加密文件、內部文件的最上面也有同一條系統列（系統名稱、登入的人、登出）
    portal: {
      name: '員工入口網',
      version: 'MVS Portal 3.2.1',
      notice: '本系統僅限本中心授權人員使用。所有登入與存取紀錄均會保存，供資訊安全稽核。',
      help: '忘記工號請洽行政室（分機 2231）；帳號遭鎖定請洽資訊組（分機 2310）。',
      role: '研究員',
      // 【草稿】研究員最後一次登入的時間。玩家登進去，看到的是他失蹤前留下的紀錄
      lastLogin: '上次登入：2026-11-07 03:12　來源：院外 VPN',
      menuTitle: '我的工作',
      newsTitle: '系統公告',
      news: [
        { date: '2026-11-18', from: '資訊組', text: '電子郵件系統將於 11/22（六）02:00–05:00 停機維護' },
        { date: '2026-11-10', from: '人事室', text: '尚未完成年度健康檢查的同仁請於月底前補檢。本年度新增眼壓與視野檢查' },
        { date: '2026-10-27', from: '總務組', text: 'B1 電子顯微鏡室空調維修完成，遠端操作已恢復' },
        { date: '2026-10-15', from: '行政室', text: '10/31（五）下午全館消防演練，屆時請依廣播疏散' }
      ],
      foot: '資訊組維護　建議使用最新版 Chrome 或 Edge'
    },
    // 訊息：員工專區裡的內部訊息系統。左邊是聊天對象，右邊是對話和輸入欄。
    // 玩家用的是研究員的帳號，帳號已經是唯讀，訊息送不出去（按傳送只會出現 readOnly）
    chat: {
      link: '訊息',
      title: '訊息',
      placeholder: '輸入訊息',
      send: '傳送',
      readOnly: '傳送失敗：此帳號目前為唯讀狀態。如有疑問請洽資訊組（分機 2310）。',
      // threads：聊天對象，照最後一則訊息的時間排，新的在上面，打開訊息時先開第一個。
      //   { id, name 名字, tag 身分標籤, unread 未讀幾則（選填，員工專區選單上的紅色數字是加總）, end 對話最下面的灰字（選填）, messages }
      //   messages 每則 { me: true 是研究員自己（選填）, time 時間, text }
      // 同事的姓氏避開故事和團契已經用過的。以下時間和對話都是【草稿】
      threads: [
        {
          id: 'feng',
          name: '馮立言',
          tag: '主任',
          unread: 2,
          messages: [
            { time: '10/20 09:12', text: '至恆，計畫期中報告週五前給我，記得附 SEM 的影像' },
            { me: true, time: '10/20 13:40', text: '好，預計週四就能給您' },
            { time: '10/27 17:55', text: '報告收到了。但影像那幾張怪怪的，而且元素分析那欄是空的？' },
            { time: '11/10 10:02', text: '這週都沒看到你來，還好嗎？' },
            { time: '11/14 16:30', text: '人事室說你沒送假單。看到回我一下' }
          ]
        },
        {
          id: 'tang',
          name: '唐子安',
          tag: '材料實驗室',
          messages: [
            { time: '10/14 11:20', text: '許哥，SEM 腔體裡那片樣品還要放著嗎？下週有人登記要用' },
            { me: true, time: '10/14 23:58', text: '先不要動 我遠端還在看' },
            { time: '10/15 08:30', text: '好，我把下週的登記往後挪' },
            { time: '10/22 12:05', text: '要訂便當，你要嗎？' },
            { me: true, time: '10/22 12:31', text: '不用 謝謝' },
            { time: '11/05 15:20', text: '液態氮這週四補，要用的話記得登記喔' }
          ]
        },
        {
          id: 'lin',
          name: '@lin_1962',
          tag: '外部聯絡人',
          end: '對方已離線。',
          // 老林 10/5 寫信，研究員 10/8 在 SEM 看見眼睛，這段聊天在那之後
          messages: [
            { time: '10/09 23:12', text: '許先生，上次寄給你的信收到了嗎？' },
            { me: true, time: '10/10 08:05', text: '收到了 你們的團契有網站嗎？我想多了解一下' },
            { time: '10/10 22:47', text: '有，但不對外。暗號有兩句，在中心裡都找的到。' },
            { time: '10/10 22:48', text: '第一句在你們中心的首頁，把你的畫面換成晚上的樣子。' },
            { time: '10/10 22:48', text: '第二句是你們創辦人留下的話。' },
            { time: '10/10 22:49', text: '兩句接在一起，打進你們中心的搜尋框。' },
            { me: true, time: '10/11 01:30', text: '為什麼是晚上？' },
            { time: '10/11 03:03', text: '他們靠光生存，沒有光的時候面紗最薄。' },
            { time: '10/11 03:03', text: '歡迎加入我們。' }
          ]
        }
      ]
    },
    dim: { text: '願你得見真光' }, // 暗號的前半句（作者 2026-11-17 定案）
    search: {
      label: '站內搜尋',
      button: '搜尋',
      empty: '查無「{q}」的相關資料。',
      needLogin: '僅供員工使用',
      resultTitle: '「{q}」的搜尋結果', // 搜尋結果頁（#search=關鍵字），結果點了開新分頁
      // 結果裡另外列出的外部連結：和視界那邊搜同一個名字找得到一樣的東西
      links: [{ keywords: ['許至恆'], title: '賀！本中心研究員許至恆榮獲生醫工程學術成果獎', href: '../wiki.html#award-news' }],
      code: ['願你得見真光 不假於目'], // 兩句有前後之分：dim.text 在前、陳醫師格言（files 的 maxim）在後，中間要有空格（tests/check.js 會檢查）
      spaced: true, // 空格算數：沒有空格不算過
      // 登入後搜尋框裡一直顯示的底字：每個 * 是一個字，空格隔開兩句
      codeHint: '****** ****',
      event: 'cult-site', // effects.map 用它給青光眼
      href: '../fellowship/index.html'
    },
    fileTexts: {
      locked: '此文件已加密',
      codeLabel: '密碼',
      button: '開啟',
      wrong: '密碼錯誤。'
    },
    files: [
      {
        // 陳醫師格言：掛在內部文件「陳學仁醫師」（docs 的 chen）底下，員工專區選單上沒有。
        // 解開後得到色覺異常效果（effects.map 的 lab-file）。點字拼的是英文 veil（面紗），鑰匙是老林寄給研究員的
        // 內文就是進教團網站的暗號後半句（search.code 的後半）
        id: 'maxim',
        title: '陳醫師格言',
        hint: '',
        hintBraille: '⠧⠑⠊⠇',
        code: 'veil',
        event: 'lab-file',
        big: true, // 內文排成置中的大字（像題字）
        paragraphs: '不假於目' // 暗號的後半句（作者 2026-11-17 定案；2026-11-22 從 SEM 移到這裡）
      }
    ],
    // SEM 能量強度紀錄：在 SEM 看見眼睛之後，右邊面板「已擷取影像」下面多出這個附件（只能下載，玩家自己用試算表畫散佈圖）。
    // 檔案有三欄數字。照時間看只是雜訊；把「強度」對「能量」畫成散佈圖，點會排成 word 這個英文詞。
    // 資料是瀏覽器現算的，要換詞只改 word 就好（只能用英文字母、數字和空格，建議 12 個字元以內）
    semLog: {
      event: 'sem-eye',
      word: 'OPHANIM', // 畫出來的詞：眼睛的名字（2026-11-15 定案）。這是眼睛自己的訊號，所以只放名字，不放動詞。
      // OPHANIM＝以西結書裡「輪圈上佈滿眼睛」的輪子，對應全站反覆出現的那一圈小方塊。
      // 眼睛沒有俗名或尊稱：有人信仰的只有高維存在，沒有人拜眼睛
      title: '附件',
      text: '連線中斷前，系統自動存下了偵測器最後一段的紀錄',
      fileName: 'SEM_intensity_log.csv',
      columns: ['time_s', 'energy_keV', 'intensity_cps'] // 檔案的欄位名稱，依序是時間、能量、強度
    },
    notes: {
      title: '研究筆記',
      owner: '{name}（{id}）　僅本人可見',
      // 初稿。樣品是他自己的眼淚：析出的立方晶體照理是氯化鈉，但元素分析對不到任何元素，
      // 之後一步步顯出生物的特性。「它吃光」對應世界觀「光是眼睛的食物」
      entries: [
        {
          title: '01｜9 月 28 日',
          paragraphs: '眼科說是不明原因的發炎，培養結果沒有細菌，正好我做了好幾年的淚液結晶實驗，拿自己的眼淚試試看。滴在試片上晾乾，放進實驗室的電子顯微鏡。\n\n上面那些立方體應該是氯化鈉。',
          photo: { src: '../assets/sem/note-1.jpg', alt: '電子顯微鏡影像：一塊表面粗糙的顆粒，上面散著許多細小的立方體。', caption: '樣品全貌' }
        },
        {
          title: '02｜9 月 30 日',
          paragraphs: '做了元素分析，立方體裡竟然沒有鈉，也沒有氯。能譜上有一組峰，但資料庫裡對不到任何元素。\n\n技術員說應該是儀器沒校正好，可是我借了合作大學的另一台，結果是一樣的。'
        },
        {
          title: '03｜10 月 2 日',
          paragraphs: '同一片樣品，立方體變多了。樣品放在真空裡，表面鍍過金，怎麼可能產生變化？\n\n之後記得放大到8000倍以上拍同一個位置（已做標記），再用能量/強度散佈圖分析數據。'
        },
        {
          title: '04｜10 月 4 日',
          paragraphs: '放在暗處，數量不變。照光一個晚上，卻多了將近一倍，奇了怪了。\n\n電子束打久的地方裂開了，隔天裂口就不見。'
        },
        {
          title: '05｜10 月 6 日',
          paragraphs: '它們好像會分裂......一顆變兩顆，形狀差不多，結晶會這樣嗎......？\n\n果然科學的盡頭是玄學。',
          // 這張是「他拍的」，結晶比較少。玩家照同樣的倍率和 WD 去拍，拍到的結晶比這張多（lab.sem.clues 的 photo）
          photo: { src: '../assets/sem/note-3.jpg', alt: '電子顯微鏡影像：幾顆立方體緊貼在一起，像是從同一顆分出來的。', caption: '標記 01' }
        },
        {
          title: '06｜10 月 8 日',
          paragraphs: '我想知道它是從哪裡長出來的，所以把倍率往回縮，想重新看看整片樣品長什麼樣子。\n\n我不該往回縮的，好詭異的幻覺，避免再想起來，我把2500以下倍率鎖住了，除非我哪天下定決心再做一次影像拍攝。'
        }
      ]
    },
    sem: {
      title: '遠端影像系統',
      kv: '15.0 kV',
      detector: 'SE',
      // 樣品底圖是 ×2,000 拍的，所以最低倍率就是 ×2,000；magMax ÷ magMin 要等於 maxScale，放大倍數才和畫面一致
      magMin: 2000,
      magMax: 16000,
      lockMag: 2500,
      maxScale: 8,
      startFocus: 50,
      surfaceFocus: 82,
      focusTolerance: 6,
      blurPerUnit: 0.12,
      maxBlur: 6,
      scanMs: 1600,
      zoomStep: 0.05,
      wheelStep: 0.04,
      panStep: 0.1,
      // image：整片樣品的底圖（真實照片，已裁掉資訊列）。拿掉 image 就改用程式產生的晶粒
      surface: { image: '../assets/sem/photo-1.jpg', width: 2048, height: 1536, seed: 7, cell: 44 },
      dummyControls: [{ name: '亮度', value: '43.8' }, { name: '對比', value: '61.2' }, { name: '像散校正 X', value: '-0.37' }, { name: '像散校正 Y', value: '+0.12' }],
      eye: {
        event: 'sem-eye', // 看見眼睛後記下的事件代號（effects.map 用它給白內障）
        image: '../assets/sem/eye.jpg',
        size: [960, 720],
        outline: 'M165 470 C 260 330, 400 255, 520 262 C 680 270, 830 320, 925 385 C 820 480, 660 575, 500 580 C 360 585, 240 540, 165 470 Z',
        opacity: 0.8,
        step: 0.08,
        minScale: 0.55,
        fieldKm: 40,
        lines: ['不要', '再看', '了'],
        lineDelay: 700,
        lost: '連線已中斷。',
        lostDelay: 6000
      },
      texts: {
        mag: '倍率',
        magUnknown: '---',
        zoomIn: '放大',
        zoomOut: '縮小',
        focus: '對焦（工作距離）',
        capture: '擷取影像',
        scanning: '掃描中…',
        saved: '影像已儲存。',
        already: '此區域的影像已存在。',
        noRegion: '畫面中心未偵測到標記區域。',
        lowMag: '倍率不足，無法解析細部結構。',
        blurry: '影像模糊，建議重新對焦。',
        noResponse: '此功能無響應。',
        magLocked: '×2,500 以下的倍率目前無法使用（原因不明）', // 拍到第一張照片之前想往 lockMag 以下調時顯示
        album: '已擷取影像',
        albumEmpty: '尚無影像。',
        help: '拖曳畫面或用方向鍵移動樣品台，滾輪或 + − 調整倍率。'
      },
      // 標記區域放大後看到的是「玩家現在拍到的」：結晶比研究筆記裡他拍的那張（assets/sem/note-3.jpg）多。
      // 倍率與對焦要對得上筆記那張照片的資訊列：×8,000、WD 21.4 mm（＝對焦值 82）
      clues: [
        { id: 'c1', x: 0.58, y: 0.58, size: 0.25, photo: '../assets/sem/photo-2.jpg', minMag: 8000, focus: 82, color: '#e0a030', label: '標記 01' }
      ]
    }
  },

  /* ----------------------------------------------------------
   * cult：教團網站（fellowship/index.html）
   * ----------------------------------------------------------
   * 崇拜高維存在的宗教組織，對外是親切的好人陣營。要先在研究單位網站的搜尋框輸入暗號才進得來；
   * 沒輸入過暗號直接開網址，會看到 missing 的「找不到頁面」。進來之後得到青光眼效果（effects.map 的 cult-site）。
   * search：右上角的「找人」，每一頁都有。名字要完全打對，才會出現那個人留下的文件。
   * files：搜得到的文件，每份 { id, keywords 搜得到它的字（要完全打對）, title, paragraphs 內文, table（選填）{ head, rows }, after（選填）表格後面的文字 }
   *        要上鎖的再加 { locked 上鎖時的說明, code 密碼, event 打開後記下的事件代號 }；沒有 code 的搜到就能看。
   *        每份文件的關鍵字都要在別的地方出現過，玩家才知道要搜什麼（tests/check.js 會檢查）。
   *        文件是一條由淺入深的階梯：傳單 → 程序單 → 講義 → 名冊，每一份的結尾帶出下一份的關鍵字。
   *        目前那一份的密碼是論壇色盲圖裡藏的 5 位數（要先有色覺異常才讀得到），打開後得到黃斑部病變（effects.map 的 cult-file）。
   * 資料夾名稱 fellowship 是暫名。內文都是佔位草稿。
   * 設定：教團是研究中心 1996 年成立的關懷小組分出來的；他們把失明的人當成「使者」。
   * 視界的知識庫有一篇離開教團的視障者專訪（wiki 的 fellowship-interview），從外面看這個組織。
   */
  cult: {
    missing: { title: '找不到這個頁面', text: '你要找的頁面不存在，或已經移除。' },
    backToLab: '← 回研究中心', // 左上角的連結。教團算研究中心的分支，所以回研究中心，不是回視界
    kicker: '歡迎回家',
    name: '闔目團契',
    aboutNav: '我們是誰', // 導覽列的第二個；點了是下面 sections 那一頁（原本首頁的介紹段落）
    /* board：首頁的聚會告示牆（2026-11-21 改版，範例見 dev/cult-layouts.html 的 B）。要讓人覺得「有人在、正在發生」。
     *   nav            導覽列第一個（首頁）
     *   countdownLabel / countdown  倒數的標題和格式：{d} 天數，{hms} 時:分:秒。倒數到每週 meetDay（0 是週日，3 是週三）的 meetHour 點
     *   liveLabel / live  聚會進行中（meetHour 點起 meetMinutes 分鐘）倒數換成這兩行。{n} 是已經到的人數，從 liveFrom 慢慢加到 liveTo
     *   when           倒數下面的聚會時間地點（一整格，空一行分段）
     *   rsvp / rsvpDone  「我會到」按鈕，按了之後換成 rsvpDone
     *   ticker         跑馬燈：誰剛做了什麼。一直隨機接下去，不會繞回同一串，盯著看也不會很快發現都是那幾個人：
     *                    names    成員本名，越多越好。最近出現過的 recent 個名字不會再被抽到
     *                    actions  動作，一則一句。{name} 換成抽到的名字，{name2} 是另一個人，{n} 是 1~5 的數字。
     *                             只是字，點不進去；玩家好奇的話自己去右上角搜尋
     *                    specials 偶爾（大約每 every 則一次）插進來的特別動態，不帶名字
     *   areas          團契裡「朋友才進得去」的地方，排在告示牆上。{ id, keywords 右上角找人也搜得到的字, title, desc 一行說明, now 現在有誰在 }。
     *                  受邀者（玩家）點得進去，但只看得到 lockedTitle / lockedText，進不了
     *   week           這一週的行事曆，text 留空的那天沒有活動
     *   notes          牆上的紙條：text 內文（一整格），by 署名，image（選填）照片，red: true 是紅筆寫的，
     * 教團裡不說「看」：網站上所有的「看」都寫成 ■（跑馬燈、紙條、文件、名冊都一樣）
     * 這裡大家都用本名註冊。以下成員都是草稿，姓氏刻意避開故事裡已經用過的（許、林、陳、周、吳、張、黃）：
     *   蔡佩君（入會三年，右眼起霧）、鄭家豪（點字班）、謝淑芬（陪伴探訪）、曾國華（視野縮小）、蕭志明（新加入）、
     *   廖文傑（分不出紅綠）、賴怡君（上傳照片）；郭玉蘭是被探訪的奶奶 */
    board: {
      nav: '告示牆',
      countdownLabel: '距離下一次熄燈聚會',
      countdown: '{d} 天 {hms}',
      meetDay: 3,
      meetHour: 20,
      meetMinutes: 60,
      liveLabel: '熄燈聚會進行中',
      live: '{n} 位朋友已經坐下',
      liveFrom: 9,
      liveTo: 47,
      when: '週三晚上八點　霧澄市舊港街 7 巷 3 號二樓\n請勿攜帶會發光的物品', // 虛構地名
      rsvp: '我會到',
      rsvpDone: '我們已經為你留了一張椅子',
      tickerLabel: '團契的動態',
      ticker: {
        // 姓氏避開故事裡已經用過的（許、林、陳、周、吳、張、黃），也避開有名的真人
        names: [
          '蔡佩君', '鄭家豪', '謝淑芬', '曾國華', '蕭志明', '廖文傑', '賴怡君', '羅雅婷', '潘建志', '江美玲',
          '何承恩', '葉淑惠', '簡宏文', '游素珍', '詹子豪', '傅雅琪', '邱振宇', '蘇月娥', '呂明哲', '洪秀琴',
          '彭冠廷', '范惠如', '杜俊傑', '魏淑娟', '鍾怡婷', '戴志偉', '薛佳穎', '盧美珠', '宋家瑋', '方慧君',
          '石雅雯', '姚宗翰', '卓玉梅', '程子翔', '甘淑華', '涂志強', '溫雅筑', '藍俊宏', '翁秀鳳', '柳承翰'
        ],
        recent: 16,
        actions: [
          '{name} 剛剛寫下一則見證',
          '{name} 在一則見證下按了「我也在等」',
          '{name} 分享了「霧又濃了一點」',
          '{name} 回覆了「週三一起坐吧」',
          '{name} 在留言板問候了新朋友',
          '{name} 報名了週三的熄燈聚會',
          '{name} 完成了點字班第 {n} 課',
          '{name} 報名了週六的陪伴探訪',
          '{name} 和 {name2} 排了下週的探訪',
          '{name} 上傳了 {n} 張照片',
          '{name} 加入了團契',
          '{name} 入會滿 {n} 年',
          '{name} 說：「今天一整天都沒有■手機」',
          '{name} 把家裡的鏡子蓋起來了'
        ],
        every: 12,
        specials: [
          '使者 正在■著這一頁',
          '一位受邀者 正在■這一頁'
        ]
      },
      areasTitle: '團契資訊',
      areas: [
        { id: 'witness', keywords: ['見證', '分享'], title: '見證分享', desc: '說說你■見了什麼', now: '4 位朋友正在讀' },
        { id: 'talk', keywords: ['留言', '問候', '聚會', '熄燈聚會', '點字班'], title: '留言板', desc: '彼此問候、聚會邀請', now: '剛剛有 2 則新留言' },
        { id: 'visits', keywords: ['探訪', '陪伴', '排班'], title: '陪伴探訪排班', desc: '探訪專區', now: '週六還缺 1 位' },
        { id: 'album', keywords: ['相簿', '照片'], title: '相簿', desc: '點字班、探訪的活動照片', now: '今天新增 3 張' },
        { id: 'members', keywords: ['名冊', '成員', '朋友'], title: '成員名冊', desc: '每一位朋友們', now: '214 位' }
      ],
      lockedTitle: '受邀者還不能進入',
      lockedText: '這裡只有朋友■得到。\n參加過一次熄燈聚會，就會有人為你開門。',
      lockedBack: '回到告示牆',
      weekLabel: '這一週',
      week: [
        { day: '週一', text: '點字班 19:30' },
        { day: '週二', text: '' },
        { day: '週三', text: '熄燈聚會 20:00' },
        { day: '週四', text: '' },
        { day: '週五', text: '' },
        { day: '週六', text: '陪伴探訪' },
        { day: '週日', text: '' }
      ],
      wallLabel: '成員留言',
      notes: [
        { text: '眼中的霧越來越濃了。今天早上醒來時，覺得內心比較平靜', by: '蔡佩君' },
        { text: '週六去■了郭玉蘭奶奶，她說最近夢裡都很亮', by: '謝淑芬', image: { src: '../assets/fellowship/visit.jpg', alt: '兩個人的背影走在林蔭道上，年輕的扶著年長的，年長的拿著手杖。' } },
        { text: '第一次來的朋友：不用準備任何東西，坐下就好，我們歡迎你', by: '團契' },
        { text: '分不出紅色和綠色之後，我看見了更多', by: '廖文傑' },
        // 老林的本名藏在這裡：1962 年生，對得上他的論壇帳號 lin_1962。搜這個名字才找得到他的日記
        { text: '我是 1962 年生的，點字班裡最年長的學生，這些課程讓我獲益良多。', by: '林永昇' },
        { text: '今天第一次閉著眼睛走完回家的路', by: '羅雅婷' },
        { text: '不要再■了', by: '', red: true },
        { text: '孫子問我為什麼把家裡的燈關掉，他還小，以後就懂了', by: '翁秀鳳' },
        { text: '點字班第三冊講義印好了，放在門口的籃子裡', by: '鄭家豪', image: { src: '../assets/fellowship/braille-class.jpg', alt: '幾個人的手放在攤開的書頁上摸讀。' } },
        { text: '為曾國華禱告：視野開始縮小，願他不再害怕', by: '代禱' },
        { text: '她在四十歲那年失去視力。她說，眼睛闔上之後，她才第一次真正■見', by: '關於第一位使者' }
      ]
    },
    verse: '「等那完全的來到，這有限的必歸於無有了。」',
    // 首頁照片（選填）。圖片路徑相對於 fellowship/。各段可以加 images: [{ src, alt, caption }]，文件可以加 image
    photo: { src: '../assets/fellowship/room.jpg', alt: '一間昏暗的房間，椅子圍成一圈，窗簾幾乎全拉上，地板上有一道光。', caption: '我們聚會的地方' },
    // 背景草稿。四則見證各對應一種眼疾效果：教團把每一種症狀都說成「面紗鬆了」
    sections: [
      {
        title: '我們是誰',
        paragraphs: '我們是一群彼此陪伴的朋友。有人■不清楚，有人■不見，也有人■得太多。\n\n團契的前身，是明域視覺科技研究中心在 1996 年成立的關懷小組。中心記錄人們■見了什麼，我們陪伴■見之後的人。'
      },
      {
        title: '起源',
        paragraphs: '關懷小組成立的第二年，來了一位年過六十的女士。她在四十歲那年失去了視力。她說，眼睛闔上之後，她才第一次真正■見。\n\n她不識字，卻記得每一位來訪者的聲音。小組裡的人把自己■見的東西說給她聽，她總是知道那是什麼。\n\n我們稱她為第一位使者。團契裡失去視力的朋友，都是先得見真光的人。我們敬重他們，聽他們說話。',
        images: [{ src: '../assets/fellowship/first-messenger.jpg', alt: '一位老太太的背影，坐在貼滿報紙的窗前，雙手攤開放在腿上。', caption: '第一位使者，1997 年' }]
      },
      {
        title: '我們相信',
        paragraphs: '那成對的，不是與生俱來的。\n\n他們不眠，為的是叫人不醒。\n\n光是他們的糧食。人在暗中，反倒■得清楚。\n\n面紗將會一層一層揭開。\n\n到那完全的來到，我們就不假於目了。'
      },
      {
        title: '我們做的事',
        paragraphs: '點字班：每週一晚上舉行。點字是不受眼睛審查的文字，我們鼓勵每一位朋友學習。\n\n陪伴探訪：到宅陪伴視力正在減退的朋友，陪他們說話、讀信、散步。\n\n熄燈聚會：每週三晚上。全程不開燈，請不要攜帶會發光的物品。初次來訪的朋友不需要準備任何東西，可以先■■我們的傳單。',
        images: [
          { src: '../assets/fellowship/braille-class.jpg', alt: '幾個人的手放在攤開的書頁上摸讀。', caption: '點字班' },
          { src: '../assets/fellowship/visit.jpg', alt: '兩個人的背影走在林蔭道上，年輕的扶著年長的，年長的拿著手杖。', caption: '陪伴探訪' },
          { src: '../assets/fellowship/lights-out.jpg', alt: '一張幾乎全黑的照片，勉強看得出有人圍坐成一圈。', caption: '上週三的聚會' }
        ]
      },
      {
        title: '見證',
        paragraphs: '「我■東西開始像隔著一層霧，朋友們為我高興，說那是面紗鬆了。」——入會三年的朋友\n\n「醫生說我得了青光眼。我在這裡學到，那不是失去。」——入會七年的朋友\n\n「分不出紅色和綠色之後，我終於看到真實。」——入會一年的朋友\n\n「我視野中心■不清楚。使者告訴我，■不清楚的那一塊，才更接近真實。」——入會五年的朋友',
        // 順序和上面四則見證一樣
        images: [
          { src: '../assets/fellowship/witness-1.jpg', alt: '一位中年男性閉著眼睛微笑。' },
          { src: '../assets/fellowship/witness-2.jpg', alt: '一位年長女性閉著眼睛微笑。' },
          { src: '../assets/fellowship/witness-3.jpg', alt: '一位年輕男性閉著眼睛微笑。' },
          { src: '../assets/fellowship/witness-4.jpg', alt: '一位中年女性閉著眼睛微笑。' }
        ]
      },
      {
        title: '常見問題',
        paragraphs: '問：這是宗教嗎？　答：我們沒有神像，也沒有教主。是不是取決於你的看法。\n\n問：需要繳費嗎？　答：我們不收取任何費用。\n\n問：我的眼睛很健康，可以參加嗎？　答：可以。每個人都是從這裡開始的。\n\n問：你們和研究中心是什麼關係？　答：我們感謝中心多年的照顧。中心記錄，我們等候。'
      }
    ],
    footer: '本團契不收取任何費用。',
    // 使者專區：首頁的連結。四種眼疾效果都出現、主線異常題全部解鎖才進得去，否則只顯示 denied。
    // 搜尋 keywords（名冊）也會找到這裡（講義第三冊的結尾帶出「名冊」）。
    // 裡面是使者名冊。捲到最底下，畫面慢慢變黑，跳出 confirm；按 yes 記下事件 event，帶玩家回測驗頁（../quiz.html?call）。
    // 有這個事件之後：異常題的選項旁出現兩種箭頭，結果頁才會出現最後一題與結局（沒有的話，異常題全選異常也照常出結果卡）
    zone: {
      link: '使者專區',
      title: '使者專區',
      keywords: ['使者', '使者專區', '名冊', '使者名冊'],
      denied: '權限不足。',
      event: 'summoned',
      confirm: '是否前往進行測試？',
      yes: '是',
      no: '否',
      // 名冊。「初兆」四種說法就是玩家身上的四種眼疾效果，最後一列是研究員。
      // 刻意不寫死原因：是團契讓人失明，還是知道太多的人本來就會走到這一步，兩種讀法都通
      roster: {
        title: '使者名冊',
        image: { src: '../assets/fellowship/ledger.jpg', alt: '桌上一本很厚的舊冊子，旁邊的紙箱裡堆滿了眼鏡。', caption: '名冊由團契保管' },
        paragraphs: '名冊記錄著已闔目的朋友',
        head: ['入會', '姓名', '初兆', '闔目'],
        // 團契裡大家都用本名。第一列是第一位使者（關懷小組成立第二年入會）；許至恆是研究員，2026 年闔目。名單要長到得捲一下才看得完
        rows: [
          ['1997', '曹罔市', '（入會前已闔目）', '—'],
          ['1998', '陳碧霞', '■物蒙霧', '2000'],
          ['1999', '徐金水', '視野收束', '2002'],
          ['2000', '李玉珠', '紅綠不辨', '2003'],
          ['2001', '周添丁', '視野收束', '2004'],
          ['2002', '王麗卿', '正中■之不明', '2005'],
          ['2003', '孫德雄', '■物蒙霧', '2006'],
          ['2004', '楊春梅', '正中■之不明', '2007'],
          ['2005', '胡德昌', '紅綠不辨', '2008'],
          ['2006', '吳阿桃', '紅綠不辨', '2008'],
          ['2007', '劉振宗', '■物蒙霧', '2010'],
          ['2008', '高翠英', '視野收束', '2011'],
          ['2009', '馬天賜', '■物蒙霧', '2012'],
          ['2010', '朱金蓮', '正中■之不明', '2012'],
          ['2011', '張文彬', '正中■之不明', '2013'],
          ['2012', '康麗雲', '視野收束', '2015'],
          ['2013', '施坤田', '紅綠不辨', '2016'],
          ['2014', '汪瑞芳', '■物蒙霧', '2017'],
          ['2015', '侯文欽', '視野收束', '2018'],
          ['2016', '余美惠', '正中■之不明', '2019'],
          ['2017', '白信義', '紅綠不辨', '2020'],
          ['2018', '連玉霞', '■物蒙霧', '2020'],
          ['2019', '黃秀蓮', '■物蒙霧', '2021'],
          ['2020', '熊志成', '視野收束', '2023'],
          ['2021', '嚴心怡', '紅綠不辨', '2023'],
          ['2022', '韓明輝', '正中■之不明', '2024'],
          ['2023', '崔淑貞', '■物蒙霧', '2025'],
          ['2024', '莊明宏', '視野收束', '2025'],
          ['2025', '丁佳蓉', '紅綠不辨', '2026'],
          ['2025', '林永昇', '紅綠不辨', '2026'],
          ['2026', '許至恆', '■物蒙霧', '2026']
        ],
        // 名冊最後多一列，是玩家自己：入會年份、name、玩家身上最先出現的眼疾效果（firstSign）、預備中。預備中的只有這一列
        player: { year: '2026', name: '「您」', pending: '預備中' },
        // 玩家那一列的初兆：照玩家身上第一個出現的眼疾效果，換成下面的說法
        firstSign: { cataract: '■物蒙霧', glaucoma: '視野收束', colorblind: '紅綠不辨', macular: '正中■之不明' },
        after: '沒有人是被勉強的，或是好奇，或是天命，我們最終走上了同一條路'
      }
    },
    // 人物頁：在找人搜本名會出現（#person-id），像社群網站的個人頁：頭像、名字、上線狀態、加入的時間、自我介紹。
    // 不正式的地方不加句號。【草稿】自我介紹由作者細修
    people: [
      {
        // 團契的源頭：研究中心創辦人、關懷小組的發起人。已經過世，所以一直是離線
        id: 'chen', name: '陳學仁', avatar: '../assets/society/chen.jpg', online: false, status: '離線', joined: '1996　創始',
        bio: '退休的眼科醫生，看了一輩子的眼睛\n\n關懷小組是我起的頭，後來大家一起創立了團契\n\n人總以為闔上眼睛就什麼都看不到，但那不是真實\n\n願你得見真光'
      },
      {
        // 第一位使者：不識字，自我介紹是朋友代打的。她看不見、也不識字，卻一直在線上
        id: 'tsao', name: '曹罔市', avatar: '../assets/fellowship/tsao.jpg', online: true, status: '在線上', joined: '1997　第一位使者',
        bio: '我毋識字，這是朋友共我拍的\n\n四十歲彼年目睭暗去，暗去了後才開始重新認捌這个世界\n\n你看著啥物，攏會使來講予我聽' // 整段台語（教育部推薦用字）
      }
    ],
    search: {
      label: '找一位朋友/文件',
      // 找人除了文件，也找得到：團契裡的地方（board.areas 的 keywords）、成員（board.ticker.names，要打全名）
      member: '{name}　團契的朋友',
      button: '尋找',
      empty: '沒有這位朋友/未開放查詢',
      back: '回到首頁',
      resultTitle: '找「{q}」', // 搜尋結果頁（#search=關鍵字），結果點了開新分頁
      joined: '入會',
      // 人物頁上的「加入」按鈕（像社群網站的加好友），按了只會出現 joinDenied
      join: '加入',
      joinDenied: '請先成為我們的一員',
      codeLabel: '密碼',
      codeButton: '開啟',
      codeWrong: '回到論壇看看我的貼文'
    },
    files: [
      {
        // 階梯 1：很溫暖的招募傳單，只有一句怪怪的。結尾帶出「程序單」
        id: 'flyer',
        keywords: ['傳單'],
        title: '給還在撐著的你',
        paper: true, // 排成一張紙的樣子
        paragraphs: '你是不是常常覺得累？不只身體，還有眼睛。\n\n你有沒有■過一閃而過的東西，轉頭又不見了？別人說那是錯覺，你卻產生了懷疑？\n\n我們只是一群也■過的人，每個星期三晚上聚在一起，把燈關掉，坐一會兒，聊聊內心。\n\n不用報名，不用繳費，只須記得不要帶會發光的東西。\n\n聚會怎麼進行，請■程序單。'
      },
      {
        // 階梯 2：一問一答的禱詞。結尾帶出「講義」
        id: 'order',
        keywords: ['程序單'],
        title: '熄燈聚會程序單',
        paper: true, // 排成一張紙的樣子
        paragraphs: '一、熄燈。眾人當闔上雙目。\n\n二、宣召。　領：他們飢餓嗎？ 眾：他們飢餓。 領：他們睡了嗎？ 眾：他們不眠。\n\n三、靜默。凡二十分鐘。若■見什麼，不可言說。\n\n四、分享。由使者先行開口。\n\n五、禱詞。　領：面紗在誰那裡？　眾：在我們臉上。　領：誰來揭開？　眾：等那完全的來到。\n\n六、散會。必待出了門外，方可開燈。\n\n禱詞的點字版，收在點字班的講義裡。'
      },
      {
        // 階梯 3：點字練習句越來越怪（英文一級點字，用論壇那篇對照表翻得出來）：
        // i see／they see for me／they choose what i see／i do not need them。結尾帶出「名冊」
        id: 'workbook',
        keywords: ['講義', '點字班講義'],
        title: '點字班講義（第三冊）',
        paper: true, // 排成一張紙的樣子
        paragraphs: '本冊的練習句由淺入深。請嘗試用指腹閱讀。\n\n第一課　⠊ ⠎⠑⠑\n\n第五課　⠞⠓⠑⠽ ⠎⠑⠑ ⠋⠕⠗ ⠍⠑\n\n第九課　⠞⠓⠑⠽ ⠉⠓⠕⠕⠎⠑ ⠺⠓⠁⠞ ⠊ ⠎⠑⠑\n\n第十二課　⠊ ⠙⠕ ⠝⠕⠞ ⠝⠑⠑⠙ ⠞⠓⠑⠍\n\n學完本冊並參與過聚會的朋友，名字會記在名冊上。'
      },
      {
        // 【草稿】色盲圖作者      {
        // 【草稿】色盲圖作者（老林，@lin_1962，本名林永昇）的日記。團契裡大家都用本名，要搜尋他的本名才找得到，密碼是色盲圖藏的數字。
        // 本名藏在告示牆上他自己的那張紙條裡（board.notes），他在紙條上說自己是 1962 年生的，對得上論壇帳號 lin_1962
        // 他就是首頁見證裡「分不出紅色和綠色之後，我第一次讀懂了那張圖」那位入會一年的朋友。
        // 時間線：2025 年 10 月入會 → 色覺變了、讀懂入門測驗 → 2026 年 9 月把測驗貼上論壇 → 寫點字信給研究員 →
        // 研究員來聚會、名字記進名冊 → 他在論壇假裝關心研究員的下落 → 自己的視野正中間開始模糊（打開這份文件，玩家也得到黃斑部病變）。
        // 從頭到尾是教團的口吻，溫暖而真誠；只有一句透出懷疑。不替眼睛下結論
        id: 'unveiled',
        keywords: ['林永昇'],
        title: '林永昇的日記',
        locked: '這份文件留給讀得到的人',
        code: '27413',
        event: 'cult-file',
        paragraphs: '既然你解得開這份文件，那代表我們是朋友。歡迎。\n\n2025 年 10 月 8 日　第一次去熄燈聚會。燈關掉以後，大家就只是安靜坐著二十分鐘。使者先說話，她說今晚很近。我不知道什麼是很近，可是我的內心卻覺得很感動。\n\n2025 年 12 月 3 日　紅色和綠色開始分不太清楚了。朋友們圍著我，像在慶祝生日。那天晚上我拿出入門的那組圖，第一次讀出了真實的數字，以前的是「他們」要我讀到的。\n\n2026 年 2 月 18 日　點字學到第三冊。用指腹讀的字，他們管不了，我現在偶爾就會練習點字。\n\n2026 年 3 月 11 日　熄燈的時候，我覺得那張面向牆的椅子上似乎有人坐，但是散會開燈時椅子還是空的，然而椅墊是溫的。\n\n2026 年 3 月 12 日　有時候我會想，我們揭開面紗後會如何。\n\n2026 年 9 月 4 日　把入門的那組圖貼到論壇上了。底下的人都讀成 74132。沒關係，面紗還在的人都是這樣。\n\n2026 年 10 月 5 日　論壇上有個人在查他們的事。他是做研究的，發過眼睛在發炎的文，我想他也產生了初兆，於是寫了一封信給他。\n\n2026 年 10 月 26 日　許先生來了。散會的時候他說了一句「都是真的」，使者笑了。他的名字已經記進名冊。\n\n2026 年 11 月 3 日　論壇上有人留言，問大家許先生是不是出事了。他沒有出事，他只是得知了一切。\n\n2026 年 11 月 10 日　正中間有一塊■不清楚。醫生說是黃斑部病變，要追蹤檢查。但我記得使者說過：■不清楚的那一塊，才更接近真實。\n\n我想我很快也能成為使者了。希望你也是，朋友。'
      }
    ]
  }
};

// 讓 Node 的檢查腳本（tests/check.js）也能讀到這份內容。瀏覽器會忽略這一行。
if (typeof module !== 'undefined' && module.exports) module.exports = EYE_CONTENT;
