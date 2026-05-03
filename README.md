# 物件ノート — Property Ledger

不動産投資家向け「持っている物件の家計簿」。
家賃と経費を10秒で記録し、確定申告用にCSV出力できる、ミニマルなWebアプリ。

## ✨ できること

- 所有物件と検討中物件の一元管理(写真付き)
- 月別・累計の収支表示、前月比つきホーム
- 表面利回り / 実質利回り の並列表示
- 検討中物件の月CF・30年累計シミュレーション
- 物件別ランキング、年別の累計推移グラフ
- 確定申告ソフト用 **CSV エクスポート**(BOM付UTF-8)
- バックアップ JSON のエクスポート / インポート
- PWA — スマートフォンのホーム画面に追加するとアプリのように動作

## 🔒 プライバシー

**すべてのデータは利用者ブラウザの localStorage にのみ保存されます。**
サーバーには一切送信されません。アカウント登録もありません。
ブラウザを変える / データを消すと見えなくなりますので、定期的にバックアップを書き出してください。

## 🛠 技術スタック

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript
- Vercel deploy

## 🚀 ローカルで動かす

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く。

```bash
npm run build && npm start
```

で本番ビルドの確認。

## 📂 プロジェクト構成

```
src/
├── app/                  ページ(App Router)
│   ├── page.tsx          ホーム
│   ├── properties/       物件一覧・詳細・追加・編集
│   ├── report/           年次レポート + CSV
│   └── settings/         バックアップ・リセット
├── components/           UI コンポーネント
└── lib/
    ├── types.ts          データモデル
    ├── store.ts          localStorage ストア + actions
    ├── calc.ts           利回り・収支計算
    └── format.ts         通貨・日付フォーマッタ
```
