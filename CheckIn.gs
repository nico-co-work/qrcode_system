// ===== 受付Webアプリ（QRスキャン後に開くページ）=====

function doGet(e) {
  var uuid = e.parameter.id || "";
  if (!uuid) return buildPage("エラー", "<p>QRコードが無効です。</p>", "#f44336");

  var result = processCheckIn(uuid);
  return buildPage(result.title, result.message, result.color);
}

// ===== 受付処理 =====
function processCheckIn(uuid) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.PROCESS_SHEET_NAME);
  var data  = sheet.getDataRange().getValues();

  // ヘッダー行（1行目）をスキップ
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[CONFIG.PROC_COL_UUID] !== uuid) continue;

    var name     = String(row[CONFIG.PROC_COL_NAME]);
    var checkedIn = row[CONFIG.PROC_COL_CHECKIN];

    if (checkedIn === true) {
      return {
        title:   "受付済み",
        message: "<p><strong>" + escapeHtml(name) + " 様</strong></p>"
               + "<p>すでに受付が完了しています。</p>",
        color: "#FF9800",
      };
    }

    // 受付処理
    var now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd HH:mm:ss");
    sheet.getRange(i + 1, CONFIG.PROC_COL_CHECKIN + 1).setValue(true);

    return {
      title:   "受付完了",
      message: "<p><strong>" + escapeHtml(name) + " 様</strong></p>"
             + "<p>受付が完了しました。</p>"
             + "<p style='color:#888;font-size:14px;'>" + now + "</p>",
      color: "#4CAF50",
    };
  }

  return {
    title:   "該当なし",
    message: "<p>このQRコードは登録されていません。</p><p>スタッフにご確認ください。</p>",
    color: "#f44336",
  };
}

// ===== HTMLページ生成 =====
function buildPage(title, bodyHtml, color) {
  var html = '<!DOCTYPE html><html><head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + escapeHtml(title) + '</title>'
    + '<style>'
    + 'body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f0f0;}'
    + '.card{background:white;border-radius:12px;padding:40px 32px;max-width:400px;width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1);}'
    + '.badge{display:inline-block;padding:12px 32px;border-radius:50px;color:white;font-size:24px;font-weight:bold;margin-bottom:24px;background:' + color + ';}'
    + 'p{color:#333;line-height:1.6;margin:8px 0;}'
    + '</style>'
    + '</head><body>'
    + '<div class="card">'
    + '<div class="badge">' + escapeHtml(title) + '</div>'
    + bodyHtml
    + '</div></body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
