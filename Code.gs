// ===== 設定 =====
var CONFIG = {
  // シート名
  FORM_SHEET_NAME:    "フォームの回答 1",
  PROCESS_SHEET_NAME: "処理シート",

  // フォームの回答1 列インデックス（0始まり）
  FORM_COL_TIMESTAMP:  0,
  FORM_COL_NAME:       1,
  FORM_COL_EMAIL:      2,
  FORM_COL_ATTENDANCE: 3, // 懇親会の参加について
  FORM_COL_OTHER:      4, // その他（アレルギーなど）

  // 処理シート 列インデックス（0始まり）
  PROC_COL_NAME:       0,
  PROC_COL_EMAIL:      1,
  PROC_COL_ATTENDANCE: 2,
  PROC_COL_OTHER:      3,
  PROC_COL_UUID:       4,
  PROC_COL_EMAIL_SENT: 5, // メール返信（チェックボックス）
  PROC_COL_CHECKIN:    6, // 当日の受付（チェックボックス）

  // メール設定
  EMAIL_SUBJECT: "【受付完了】懇親会参加登録のご確認",
  EVENT_NAME:    "けいたろうさんオフ会",
  EVENT_DATE:    "2026年6月15日（月）19:00〜21:00",
  EVENT_PLACE:   "渋谷 THE DINING LOUNGE（渋谷駅徒歩3分）",

  // QRメールを送る対象（懇親会の参加についての回答値）
  ATTENDANCE_SEND_QR: "参加する",

  QR_SIZE: "300x300",
};

// ===== フォーム送信トリガー =====
function onFormSubmit(e) {
  var values = e.values;
  var name       = values[CONFIG.FORM_COL_NAME]       || "";
  var email      = values[CONFIG.FORM_COL_EMAIL]      || "";
  var attendance = values[CONFIG.FORM_COL_ATTENDANCE] || "";
  var other      = values[CONFIG.FORM_COL_OTHER]      || "";
  var uuid       = Utilities.getUuid();

  // 処理シートに転記
  var processSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.PROCESS_SHEET_NAME);
  if (!processSheet) {
    Logger.log("エラー: 「" + CONFIG.PROCESS_SHEET_NAME + "」シートが見つかりません。");
    return;
  }
  // A列（お名前）で空行を探す（getLastRow はチェックボックスもカウントするためNG）
  var nameCol = processSheet.getRange("A:A").getValues();
  var newRow = 2;
  for (var i = 1; i < nameCol.length; i++) {
    if (!nameCol[i][0]) { newRow = i + 1; break; }
  }

  processSheet.getRange(newRow, CONFIG.PROC_COL_NAME       + 1).setValue(name);
  processSheet.getRange(newRow, CONFIG.PROC_COL_EMAIL      + 1).setValue(email);
  processSheet.getRange(newRow, CONFIG.PROC_COL_ATTENDANCE + 1).setValue(attendance);
  processSheet.getRange(newRow, CONFIG.PROC_COL_OTHER      + 1).setValue(other);
  processSheet.getRange(newRow, CONFIG.PROC_COL_UUID       + 1).setValue(uuid);
  processSheet.getRange(newRow, CONFIG.PROC_COL_EMAIL_SENT + 1).setValue(false);
  processSheet.getRange(newRow, CONFIG.PROC_COL_CHECKIN    + 1).setValue(false);

  // 「参加する」の場合のみQRメール送信
  if (attendance === CONFIG.ATTENDANCE_SEND_QR) {
    var checkInUrl = getWebAppUrl() + "?id=" + uuid;
    sendConfirmationEmail(email, name, attendance, other, uuid, checkInUrl);
    processSheet.getRange(newRow, CONFIG.PROC_COL_EMAIL_SENT + 1).setValue(true);
    Logger.log("QRメール送信: " + name + " / " + uuid);
  } else {
    Logger.log("メールスキップ（参加しない）: " + name);
  }
}

// ===== QR画像をBlobで取得 =====
function getQrBlob(data) {
  var url = "https://api.qrserver.com/v1/create-qr-code/?size=" + CONFIG.QR_SIZE
    + "&data=" + encodeURIComponent(data);
  return UrlFetchApp.fetch(url).getBlob().setName("qrcode.png");
}

// ===== WebアプリURL取得 =====
// onFormSubmitトリガーからはScriptApp.getService().getUrl()がDrive URLを返すため直接指定
function getWebAppUrl() {
  return "https://script.google.com/macros/s/AKfycbwBxD77-j6egycb1hEmUPT0Tyg6WYCpDA4ju5iyasJEEOH6Bzno5S41TjBjUhxMa2iewQ/exec";
}

// ===== メール送信 =====
function sendConfirmationEmail(email, name, attendance, other, uuid, checkInUrl) {
  if (!email) {
    Logger.log("メールアドレスなし: " + uuid);
    return;
  }
  var qrBlob   = getQrBlob(checkInUrl);
  var subject  = CONFIG.EMAIL_SUBJECT;
  var body     = buildEmailBody(name, attendance, uuid, checkInUrl);
  var htmlBody = buildEmailHtml(name, attendance, other, uuid, checkInUrl);

  GmailApp.sendEmail(email, subject, body, {
    htmlBody:     htmlBody,
    inlineImages: { qrcode: qrBlob },
    name:         CONFIG.EVENT_NAME + " 運営事務局",
  });
}

// ===== メール本文（テキスト）=====
function buildEmailBody(name, attendance, uuid, checkInUrl) {
  return [
    name + " 様",
    "",
    CONFIG.EVENT_NAME + " へのご登録ありがとうございます。",
    "",
    "【イベント情報】",
    "日時: " + CONFIG.EVENT_DATE,
    "場所: " + CONFIG.EVENT_PLACE,
    "参加区分: " + attendance,
    "",
    "【受付ID】",
    uuid,
    "",
    "当日はQRコードをスタッフにご提示ください。",
    "QRコードURL: " + checkInUrl,
  ].join("\n");
}

// ===== メール本文（HTML）=====
function buildEmailHtml(name, attendance, other, uuid, checkInUrl) {
  var otherRow = other
    ? '<tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">備考</td>'
      + '<td style="padding:8px;border:1px solid #ddd;">' + escapeHtml(other) + '</td></tr>'
    : "";

  return '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">'
    + '<h2 style="color:#333;">登録完了のご案内</h2>'
    + '<p>' + escapeHtml(name) + ' 様</p>'
    + '<p>' + escapeHtml(CONFIG.EVENT_NAME) + ' へのご登録ありがとうございます。</p>'
    + '<table style="border-collapse:collapse;width:100%;margin:16px 0;">'
    + '<tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;width:130px;">日時</td>'
    + '<td style="padding:8px;border:1px solid #ddd;">' + escapeHtml(CONFIG.EVENT_DATE) + '</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">場所</td>'
    + '<td style="padding:8px;border:1px solid #ddd;">' + escapeHtml(CONFIG.EVENT_PLACE) + '</td></tr>'
    + '<tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">参加区分</td>'
    + '<td style="padding:8px;border:1px solid #ddd;">' + escapeHtml(attendance) + '</td></tr>'
    + otherRow
    + '<tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">受付ID</td>'
    + '<td style="padding:8px;border:1px solid #ddd;font-family:monospace;font-size:12px;">' + escapeHtml(uuid) + '</td></tr>'
    + '</table>'
    + '<p style="font-weight:bold;">当日はこちらのQRコードをスタッフにご提示ください：</p>'
    + '<div style="text-align:center;margin:24px 0;">'
    + '<img src="cid:qrcode" alt="受付QRコード" style="border:1px solid #ddd;padding:8px;" />'
    + '</div>'
    + '<p style="text-align:center;">'
    + '<a href="' + checkInUrl + '" style="display:inline-block;padding:12px 24px;background:#4CAF50;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">📱 タップして受付（QRが読めない場合）</a>'
    + '</p>'
    + '<p style="font-size:12px;color:#666;">このメールに心当たりがない場合は運営事務局までご連絡ください。</p>'
    + '</div>';
}

// ===== HTMLエスケープ =====
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
