# Page snapshot

```yaml
- alert: 台北市中正區 附近租車推薦｜LOOP 共享汽車，輕鬆取還
- navigation:
  - link "LOOP logo":
    - /url: /
    - img "LOOP logo"
  - link "關於路朋":
    - /url: /about
  - link "成為共享車主":
    - /url: /carOwnerRecruitment
  - button "登入帳號"
- text: 想在哪裡取車
- combobox "想在哪裡取車": 台北市中正區台北車站
- button "Open"
- text: 取車時間 / 還車時間
- textbox "取車時間 / 還車時間": 10月01日 10:00 ~ 10月02日 10:00
- img "clock"
- img "filter"
- paragraph: 共 0 個站點
- text: 共 0 輛車 僅可租賃車輛
- checkbox
- text: 沒有符合條件的車輛, 請更改搜尋條件
- button "地圖"
- img "gift"
- text: 入秋首次預訂享優惠！
- paragraph: 第一次加入 LOOP，輸入【FIRST250】直接領 $250 租車金！效期至 11/30
```