// ===== スプレッドシートを開いたときにカスタムメニューを追加 =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("受付システム")
    .addItem("▶ 初期設定（トリガーをセット）", "setupTrigger")
    .addItem("🔍 トリガーの状態を確認", "checkTriggerStatus")
    .addItem("🗑 トリガーを削除", "deleteTrigger")
    .addItem("📋 処理シートを作成", "createProcessSheet")
    .addToUi();
}

// ===== 1. トリガー設定 =====
function setupTrigger() {
  var ui = SpreadsheetApp.getUi();

  // 既存のonFormSubmitトリガーを削除（重複防止）
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "onFormSubmit") ScriptApp.deleteTrigger(t);
  });

  // 新規作成
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  ui.alert("初期設定完了",
    "✓ onFormSubmit トリガーを設定しました。\nフォームに回答が届くと自動でQRメールを送信します。",
    ui.ButtonSet.OK);
}

// ===== 2. トリガーの状態を確認 =====
function checkTriggerStatus() {
  var ui = SpreadsheetApp.getUi();
  var triggers = ScriptApp.getProjectTriggers();
  var found = triggers.filter(function(t) {
    return t.getHandlerFunction() === "onFormSubmit";
  });

  if (found.length > 0) {
    ui.alert("トリガー確認",
      "✅ onFormSubmit トリガーが " + found.length + " 件設定されています。\n正常に動作中です。",
      ui.ButtonSet.OK);
  } else {
    ui.alert("トリガー確認",
      "⚠️ onFormSubmit トリガーが設定されていません。\n「初期設定」を実行してください。",
      ui.ButtonSet.OK);
  }
}

// ===== 3. トリガーを削除 =====
function deleteTrigger() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    "トリガーを削除",
    "onFormSubmit トリガーを削除しますか？\nフォーム送信への自動反応が停止します。",
    ui.ButtonSet.OK_CANCEL
  );

  if (result !== ui.Button.OK) return;

  var count = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "onFormSubmit") {
      ScriptApp.deleteTrigger(t);
      count++;
    }
  });

  ui.alert("削除完了", "🗑 " + count + " 件のトリガーを削除しました。", ui.ButtonSet.OK);
}

// ===== 4. 処理シートを作成 =====
function createProcessSheet() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var existing = ss.getSheetByName(CONFIG.PROCESS_SHEET_NAME);

  if (existing) {
    var result = ui.alert(
      "処理シートが既に存在します",
      "「" + CONFIG.PROCESS_SHEET_NAME + "」は既にあります。上書きしますか？",
      ui.ButtonSet.OK_CANCEL
    );
    if (result !== ui.Button.OK) return;
    ss.deleteSheet(existing);
  }

  // シートを新規作成
  var sheet = ss.insertSheet(CONFIG.PROCESS_SHEET_NAME);

  // ヘッダー行
  var headers = ["お名前", "メール", "懇親会の参加について", "その他", "ユニークなID", "メール返信", "当日の受付"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダーのスタイル
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#4a4a4a").setFontColor("#ffffff").setFontWeight("bold");

  // F・G列にチェックボックスを設定（2行目以降）
  var checkboxRange = sheet.getRange(2, CONFIG.PROC_COL_EMAIL_SENT + 1, 500, 2);
  checkboxRange.insertCheckboxes();

  // 列幅を調整
  sheet.setColumnWidth(1, 120); // お名前
  sheet.setColumnWidth(2, 200); // メール
  sheet.setColumnWidth(3, 160); // 懇親会の参加
  sheet.setColumnWidth(4, 160); // その他
  sheet.setColumnWidth(5, 280); // UUID
  sheet.setColumnWidth(6, 90);  // メール返信
  sheet.setColumnWidth(7, 90);  // 当日の受付

  // 行を固定
  sheet.setFrozenRows(1);

  ui.alert("作成完了",
    "📋 「" + CONFIG.PROCESS_SHEET_NAME + "」を作成しました。\nチェックボックスも設定済みです。",
    ui.ButtonSet.OK);
}
