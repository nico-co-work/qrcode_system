# 🎟️ QRコード受付システム

> Google Apps Script × Clasp × GitHub で「育てられる」受付システム

フォーム申込からQRコード発行・当日受付までを完全自動化。スマホでQRを読むだけで受付完了。

---

## ✨ できること

| 機能 | 内容 |
|---|---|
| 自動QRメール送信 | フォーム送信と同時にQRコード付きメールを自動送信 |
| 一人一枚ユニークQR | UUID で全員バラバラのQRコードを発行 |
| スマホで即受付 | QRスキャン → 受付完了画面 → スプレッドシートに自動記録 |
| 二重受付ブロック | 同じQRを2回読んでも「受付済み」と表示 |
| 参加条件フィルター | 「参加する」人のみQRメール送信（不参加はスキップ） |
| タップ受付リンク | QRが読めない場合でもメール内ボタン1タップで受付完了 |
| スプレッドシートメニュー | 初期設定・トリガー確認・処理シート作成がボタン1つ |

---

## 🏗️ システム構成

```
フォーム送信
  ↓ onFormSubmit（自動起動）
  ↓ UUID生成（Utilities.getUuid）
  ↓ 処理シートに転記
  ↓ QR画像取得（api.qrserver.com）
  ↓ GmailでQR付きメール送信（inlineImages方式）
  ↓   └ QR画像（埋め込み）
  ↓   └ 📱 タップして受付ボタン（リンク付き）
  ↓ メール返信列を ✅ に

当日スマホでQRスキャン or タップ
  ↓ WebアプリURL + UUID を開く
  ↓ 処理シートでUUID照合
  ↓ 当日受付列を ✅ に（二重は「受付済み」表示）
```

---

## 📁 ファイル構成

| ファイル | 役割 |
|---|---|
| `Code.gs` | メインロジック（フォーム送信トリガー・QR生成・メール送信） |
| `CheckIn.gs` | QRスキャン受付Webアプリ（doGet） |
| `Setup.gs` | onOpenメニュー・トリガー設定・処理シート作成 |
| `appsscript.json` | GASプロジェクト設定（Webアプリ公開設定含む） |
| `.clasp.json` | Claspデプロイ設定（Script ID） |

---

## 📊 スプレッドシート構成

### フォームの回答1（自動生成）

| A | B | C | D | E |
|---|---|---|---|---|
| タイムスタンプ | お名前 | メール | 懇親会の参加について | その他 |

### 処理シート（GASが自動生成）

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| お名前 | メール | 懇親会の参加について | その他 | ユニークID | メール返信☑ | 当日の受付☑ |

---

## 🚀 セットアップ手順

### 前提条件

- Clasp のインストール: `npm install -g @google/clasp`
- GAS に紐づく Google アカウントで clasp login

```bash
clasp login   # ブラウザでログイン（Terminal.app で実行すること）
```

> ⚠️ Claude Code の `!` コマンドからは `clasp login` のブラウザが開かない場合がある。Terminal.app で直接実行する。

### 1. .clasp.json にScript IDをセット

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```

Script ID はGASエディタの「プロジェクトの設定」から確認できる。

### 2. GASにコードをプッシュ

```bash
clasp push --force
```

### 3. Webアプリとしてデプロイ

GASエディタで：

```
デプロイ → 新しいデプロイ
→ 種類：ウェブアプリ
→ 次のユーザーとして実行：自分
→ アクセスできるユーザー：全員（ログイン不要）
→ デプロイ → URLをコピー
```

コピーしたURLを `Code.gs` の `getWebAppUrl()` に貼り付け：

```javascript
function getWebAppUrl() {
  return "https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec";
}
```

再度 `clasp push --force` で反映。

### 4. スプレッドシートで初期設定

スプレッドシートを開く（再読み込み）→ メニューバーに「受付システム」が出現

```
受付システム → 処理シートを作成
受付システム → 初期設定（トリガーをセット）
```

### 5. 動作確認

フォームにテスト回答を送信 → メールが届いてQRが表示されればOK！

---

## 🔧 カスタマイズ

`Code.gs` の `CONFIG` を変更するだけ：

```javascript
var CONFIG = {
  EVENT_NAME:          "イベント名",           // メールのタイトルに使用
  EVENT_DATE:          "2026年6月15日 19:00",  // メール本文に表示
  EVENT_PLACE:         "会場名",              // メール本文に表示
  ATTENDANCE_SEND_QR:  "参加する",            // この回答の人だけQRメール送信
};
```

変更後は `clasp push --force` + デプロイ更新で反映。

---

## 🔄 日常の更新フロー（Claspデプロイ）

コードを変更したら `/clasp-deploy` コマンドを実行するだけ：

```
clasp push → git commit → git push
```

GASとGitHub両方に自動で反映されます。

---

## 📋 受付システムメニュー一覧

| メニュー | 機能 |
|---|---|
| ▶ 初期設定（トリガーをセット） | onFormSubmit トリガーを登録（重複防止付き） |
| 🔍 トリガーの状態を確認 | 設定済みかチェックしてダイアログ表示 |
| 🗑 トリガーを削除 | 確認後にトリガーを削除 |
| 📋 処理シートを作成 | ヘッダー・チェックボックス・列幅を自動設定 |

---

## 🐛 既知のバグと対処法（実装で踏んだ地雷）

実際の開発で遭遇したバグと修正内容をまとめる。次回同じ状況でハマらないための記録。

---

### ① `getLastRow()` がチェックボックスをカウントしてデータがズレる

**症状**: 処理シートにデータが書き込まれない。ログには成功とある。

**原因**: `createProcessSheet()` で F2:G501 に `insertCheckboxes()` しているため、
`getLastRow()` が 501 を返す → 新規行が 502 になり、画面に見えない行に書き込まれる。

**修正**: `getLastRow()` を使わず、A列を走査して空行を探す：

```javascript
var nameCol = processSheet.getRange("A:A").getValues();
var newRow = 2;
for (var i = 1; i < nameCol.length; i++) {
  if (!nameCol[i][0]) { newRow = i + 1; break; }
}
```

---

### ② `ScriptApp.getService().getUrl()` がDrive URLを返す

**症状**: QRコードを読み込むと「現在ファイルを開くことができません」（Google Drive のエラー画面）。

**原因**: `onFormSubmit` トリガーから呼ばれた場合、`getService().getUrl()` は
ウェブアプリのURLではなくGoogleドライブのURLを返す（Googleのバグ的な仕様）。

**修正**: WebアプリURLを直接ハードコード：

```javascript
function getWebAppUrl() {
  return "https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec";
}
```

---

### ③ QRカメラスキャンでGoogle Driveエラーになる（未解決）

**症状**: メール内のQR画像をカメラアプリで読み取るとGoogle Driveのエラー画面になる。

**推定原因**: 一部のQRリーダーはURLをWebView内で開く際にGoogleのリダイレクト処理が介入し、
認証が必要なURLとして扱われることがある。

**回避策**: メール本文に「📱 タップして受付（QRが読めない場合）」ボタンを追加。
直接タップすれば受付完了画面が表示される。

```html
<a href="[checkInUrl]" style="...background:#4CAF50...">📱 タップして受付</a>
```

---

### ④ `clasp login` がClaude Code端末から動かない

**症状**: `! clasp login` を実行してもブラウザが開かない。

**原因**: Claude Code の `!` プレフィックスコマンドはブラウザを起動できる環境ではないため。

**修正**: **Terminal.app** を直接開いて `clasp login` を実行する。

---

### ⑤ `clasp push` で "The caller does not have permission"

**症状**: `clasp push` がパーミッションエラーになる。

**原因**: 別のGoogleアカウントでclasp loginしていた。
GASプロジェクトのオーナーアカウントと異なるアカウントではpushできない。

**修正**: `clasp logout` してから正しいアカウントで `clasp login` し直す。
`clasp list` でScript IDが正しく見えることを確認してからpush。

---

### ⑥ `buildEmailHtml` に `checkInUrl` を渡す必要がある

**症状**: メール内タップボタンを追加する際、関数シグネチャのミスマッチでエラー。

**修正**: 関数定義と呼び出し元の両方に `checkInUrl` 引数を追加：

```javascript
// 定義
function buildEmailHtml(name, attendance, other, uuid, checkInUrl) { ... }

// 呼び出し
var htmlBody = buildEmailHtml(name, attendance, other, uuid, checkInUrl);
```

---

## 🌱 今後の拡張アイデア

- **Slack通知**: 受付時にSlackに参加ログを送信
- **iPad受付**: iPadを受付台に置いてスタッフが確認
- **スタンプラリー**: 各ポイントにQR設置して読み取り記録
- **来客管理**: 来訪者QR → 担当者にメール通知
- **QRスキャン修正**: カメラアプリで直接読み込める原因調査・修正

---

## 🛠️ 使用技術

- [Google Apps Script](https://script.google.com) — バックエンド・自動化
- [Clasp](https://github.com/google/clasp) — ローカル開発・デプロイ
- [api.qrserver.com](https://api.qrserver.com) — QRコード生成API（無料・キー不要）
- [GitHub](https://github.com/nico-co-work/qrcode_system) — バージョン管理
