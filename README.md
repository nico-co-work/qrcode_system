# QRコード受付システム

Googleフォーム申込からQRコード発行・当日受付までを全自動化するGoogle Apps Script。

## 機能

- フォーム送信をトリガーに自動でUUID生成
- QRコード画像をメールにインライン添付して自動送信
- QRスキャンで受付処理（スプレッドシートに自動記録）

## フロー

```
フォーム送信
  → UUID生成 → スプレッドシート記録
  → QR画像生成（api.qrserver.com）
  → GmailでQR付きメール自動送信

当日QRスキャン
  → WebアプリURLを開く
  → 受付済みマーク → スプレッドシートに受付日時記録
```

## ファイル構成

| ファイル | 役割 |
|---|---|
| `Code.gs` | フォーム送信トリガー・QR生成・メール送信 |
| `CheckIn.gs` | QRスキャン後の受付処理Webアプリ |
| `appsscript.json` | GASプロジェクト設定 |

## セットアップ

### 1. スプレッドシート準備

Googleフォームを作成（氏名・メールアドレス・所属）し、回答をスプレッドシートに連携。

スプレッドシートの列構成：

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| タイムスタンプ | 氏名 | メール | 所属 | 受付ID | 受付状態 | 受付日時 |

### 2. GASにデプロイ

```bash
clasp push
```

Apps Scriptエディタで「デプロイ → 新しいデプロイ」（Webアプリとして、アクセス：全員）。

### 3. トリガー設定

Apps Scriptエディタ → トリガー → 追加：

- 関数: `onFormSubmit`
- イベント: フォーム送信時

### 4. CONFIGを編集

`Code.gs` の `CONFIG` でイベント名・日時・場所を設定。

```javascript
var CONFIG = {
  EVENT_NAME:  "イベント名",
  EVENT_DATE:  "2026年XX月XX日",
  EVENT_PLACE: "会場名",
  ...
};
```

## 使用API

- **QRコード生成**: [api.qrserver.com](https://api.qrserver.com)（無料・キー不要）
- **メール送信**: GmailApp（GAS内蔵）
- **スプレッドシート**: SpreadsheetApp（GAS内蔵）
