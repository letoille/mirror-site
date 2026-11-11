# 流亡黯道國際服入坑指南：下載、工具與中文交易

> Canonical: https://mirror.kalandraeye.com/tw/guide/international-starter.html
> Language: zh-Hant

玩國際服，除了下載遊戲，通常還要準備查價工具、掉落過濾器，以及方便自己使用的交易介面。這篇整理了下載入口、常用工具和網站，POE1、POE2 玩家都可以參考。

文中會介紹我們開發的魔鏡，查價、過濾器和市集部分用魔鏡示範。

## 一、註冊和下載

- [POE1 官網：pathofexile.com](https://www.pathofexile.com/)
- [POE2 官網：pathofexile2.com](https://pathofexile2.com/)

點擊官網的 **Create Account** 註冊帳號，再下載客戶端。是否需要購買或取得遊玩資格，請查看官網目前的說明。

![POE1 官網頂部的 Create Account 註冊入口與 PC 下載入口](https://mirror.kalandraeye.com/shots/guides/international-starter/poe1-entry.webp)

POE1：左上角 Create Account 註冊，右側 PC 是 Windows 客戶端入口。

![POE2 官網 Downloads 頁面與 Windows 安裝程式入口](https://mirror.kalandraeye.com/shots/guides/international-starter/poe2-download.webp)

POE2：官網頂部同樣有 Create Account；[下載頁](https://pathofexile2.com/download)選擇 Windows 客戶端。

從中國大陸連線到國際服時，如果延遲高、切換地圖時斷線，可以嘗試遊戲加速器的國際服線路，並在登入介面比較不同閘道的連線狀況。

建立角色時建議先選目前賽季的一般模式。準備和其他玩家交易的話，不要選自力模式（SSF）。

## 二、POE1 遊戲中文化

POE1 國際服需要中文介面，可以使用 [PoEDB 的中文化頁面](https://poedb.tw/tw/chinese)提供的工具。下面以支援繁體與簡體中文的 **VPatchGGPK3** 為例；同頁的 PoeChinese3 只支援繁體中文。

1. 在頁面找到「Pin 碼 繁體中文/簡體中文」，透過下載連結取得 **VPatchGGPK3_win-x64.zip**，解壓縮。
2. 關閉遊戲，開啟 **VPatchGGPK.exe**。如果提示缺少執行環境，安裝頁面列出的 Microsoft .NET Desktop Runtime 8。
3. 選擇遊戲檔案：獨立客戶端選擇安裝目錄裡的 **Content.ggpk**；Steam / Epic 客戶端選擇 **Bundles2** 目錄裡的索引檔案，實際檔名依頁面說明選擇。
4. 語系選擇 **tw**，輸入 PoEDB 頁面頂部目前顯示的 **tw PIN**，點擊「套用中文化」。
5. 看到「Done! 中文化完成!」後啟動遊戲，在登入介面選擇第二個法國國旗切換語言。

![PoEDB 中文化頁面頂部的 tw 和 cn PIN，以及遊戲和修補程式版本](https://mirror.kalandraeye.com/shots/guides/international-starter/poedb-chinese.webp)

PIN 會隨更新變動，請使用[頁面](https://poedb.tw/tw/chinese)當時顯示的值，不要照抄截圖。

遊戲更新後，需要依頁面說明重新中文化。該工具會修改遊戲檔案，有違反遊戲使用條款的風險，使用前請備份原始檔案。

## 三、常用工具：查價、過濾器和中文市集

查價工具、過濾器、交易站中文化、正則產生器，這些通常需要分別找工具。魔鏡把大部分常用功能集中到了一起，支援 POE1 和 POE2。

[下載魔鏡](https://mirror.kalandraeye.com/tw/download.html)。安裝後選好遊戲、區服和語言，先用下面這三項。

### 1. 查價

在遊戲裡把滑鼠移到物品上，按 `Ctrl` + `E`，就能開啟查價浮層，查看詞綴並搜尋相近物品的掛單。

![魔鏡查價浮層中的詞綴勾選、數值下限和搜尋入口，圖為簡體中文介面](https://mirror.kalandraeye.com/shots/guides/international-starter/price.webp)

查價浮層：勾選用於比較的詞綴，調整數值下限後搜尋。

查價時，魔鏡會自動勾選一些高價值詞綴。不熟悉裝備詞綴的話，可以直接使用預設勾選的詞綴搜尋。

### 2. 掉落過濾器

過濾器用顏色、字體大小、提示音等方式區分掉落，也可以隱藏不需要的物品。開荒時建議用顯示範圍較寬的版本，等裝備和刷圖效率提升後，再提高嚴格度。

魔鏡客戶端有過濾器安裝入口，也可以在[過濾器頁面](https://trade.kalandraeye.com/tw/filters)手動下載。

![魔鏡過濾器頁面，提供遊戲切換與開荒、異界、速刷等版本](https://mirror.kalandraeye.com/shots/web-filter.webp)

先選對應遊戲，再選過濾版本。圖中為 POE2 頁面。

安裝後還需要到遊戲設定裡選取該過濾器，才會生效。手動下載與客戶端一鍵安裝是兩種方式；其中客戶端一鍵安裝需要登入並開通。

### 3. 中文市集

官方交易站可以依物品、詞綴和價格搜尋。不熟悉英文物品名、詞綴名，可以直接用[魔鏡市集](https://trade.kalandraeye.com/tw/)的中文介面，支援英文、簡中、繁中檢索。

選好物品類別後，魔鏡市集會先篩掉該類別不會出現的詞綴，縮小可選範圍，不用在幾千條詞綴裡逐一尋找。

比如想買一枚補生命和抗性的戒指：

1. 選好遊戲、國際服和賽季。
2. 選擇戒指類別，加入生命、抗性條件。
3. 設定最低屬性要求和價格上限，再搜尋。
4. 查看裝備屬性與需求，找到合適的掛單後聯絡賣家。

![魔鏡市集簡體中文介面中的物品類別、價格範圍和詞綴篩選](https://mirror.kalandraeye.com/shots/guides/international-starter/market.webp)

市集篩選區。圖中是武器查詢，戒指需要切換到對應類別。

魔鏡市集使用官方交易資料，搜尋時需要保持客戶端執行。

### 其他功能

魔鏡還整合了即時行情、通貨兌換比率、正則、速查圖、計時器和收益統計等功能。兩代遊戲的具體支援範圍見[官網說明](https://mirror.kalandraeye.com/tw/client.html)。

## 四、常用網站

### poe.ninja：看熱門職業和配裝

網址：[poe.ninja](https://poe.ninja/)

行情可以直接在魔鏡裡查看。poe.ninja 主要用來了解目前賽季的熱門職業、技能和配裝，也可以查看具體角色的裝備、技能搭配與天賦。

![poe.ninja 繁體中文流派頁面，顯示賽季選擇、職業分布與篩選入口](https://mirror.kalandraeye.com/shots/guides/international-starter/ninja-builds.webp)

[poe.ninja 流派頁](https://poe.ninja/zh-tw/poe1/builds)：選賽季、點職業，再依技能篩選。圖中為 POE1，頂部可以切到 POE2。

### PoEDB：查物品、技能和詞綴資料

網址：[POE1 資料庫](https://poedb.tw/tw/) · [POE2 資料庫](https://poe2db.tw/tw/)

PoEDB 支援中文，可以查詢裝備基底、傳奇物品、技能、怪物和詞綴資料。比如想知道某個部位能出哪些詞綴、詞綴有幾階、數值範圍是多少，都可以在這裡查。

![PoEDB 戒指詞綴頁，展開最大生命詞綴後顯示 T1 至 T8 的需求等級、數值範圍與權重](https://mirror.kalandraeye.com/shots/guides/international-starter/poedb-modifiers.webp)

[PoEDB 戒指詞綴頁](https://poedb.tw/tw/Rings#ModifiersCalc)：點擊一條詞綴，可以查看各階的物品等級要求、數值範圍和權重。

截圖僅作操作示意，部分介面為簡體中文，其中的賽季、版本和價格不代表目前資料。點擊圖片可放大查看。

---

**相關教學**：[怎麼查一件裝備值多少錢](https://mirror.kalandraeye.com/tw/guide/price-check.html) · [掉落過濾器怎麼裝](https://mirror.kalandraeye.com/tw/guide/loot-filter.html) · [魔鏡市集怎麼用](https://mirror.kalandraeye.com/tw/guide/market.html)
