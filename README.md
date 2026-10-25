# School Fair Savings Quest

「園遊會卡片收藏家」是一款以 Phaser 4 製作的瀏覽器遊戲，讓國小高年級玩家透過六週的任務收入、突發事件、可選消費與存款分配，練習規劃目標儲蓄。

## 遊玩

https://lloyd3126.github.io/school-fair-savings-quest/

## 本機開發

```sh
npm ci
npm run dev
```

建立正式版並在本機預覽：

```sh
npm run build
npm run preview
```

## 學習紀錄

遊戲可將每週決策與遊玩結局送至 Google 試算表。若要啟用，請在本機 `.env.local` 設定 `VITE_EVIDENCE_ENDPOINT`；GitHub Pages 的建置則使用 repository Actions variable `VITE_EVIDENCE_ENDPOINT`。

此網址是匿名公開的 Apps Script Web App endpoint，會包含在瀏覽器程式中。請勿在此變數放入密碼、憑證或其他秘密。遊戲不收集玩家姓名或 Email。

## 素材

動物卡片使用 Kenney 的 Animal Pack Remastered。原始素材與授權說明位於 `asset-source/kenney/animal-pack-remastered/`；素材採 Creative Commons Zero（CC0）授權。

## 部署

推送至 `main` 後，GitHub Actions 會建置遊戲並發佈至 GitHub Pages。Vite 會在 GitHub Actions 建置時套用 repository 專用路徑。
