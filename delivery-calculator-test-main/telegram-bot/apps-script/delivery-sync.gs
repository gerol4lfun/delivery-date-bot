/**
 * Delivery sync: читает Google Sheet поставщика, формирует rows, POST в endpoint.
 *
 * Script Properties (обязательные):
 *   SYNC_URL     — https://your-app.vercel.app/api/sync-delivery
 *   SYNC_SECRET  — секрет для X-Sync-Secret
 *   SPREADSHEET_ID — ID таблицы поставщика (или URL)
 *
 * Trigger: time-driven, каждые 10–15 минут.
 *
 * Структура листа (реальная):
 *   - Row0: [месяц, Date, Date, ...] — месяц в col0, даты в col1+
 *   - Row1: ["", "вс", "пн", ...] — дни недели, пропускается
 *   - Row2+: [город, статус, статус, ...] — направления и статусы X/ДС/Д/С
 *   - пустая строка — разделитель между месяцами
 */

var MONTH_NAMES = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
var VALID_STATUS = /^[ДСXХ]{1,2}$/i;
var DAY_NAMES_PATTERN = /^(пн|вт|ср|чт|пт|сб|вс|пон|вто|сре|чет|пят|суб|вос|пнд|втр|срд|чтв|птн|сбт|вск)[.\s]*$/i;

var DIRECTION_ALIAS = {
  'москва и мо': 'Москва и МО', 'москва и м.о.': 'Москва и МО', 'москва': 'Москва',
  'санкт-петербург и обл.': 'Санкт-Петербург', 'санкт-петербург и ло': 'Санкт-Петербург',
  'спб и ло': 'Санкт-Петербург', 'питер': 'Санкт-Петербург', 'петербург': 'Санкт-Петербург', 'спб': 'Санкт-Петербург',
  'великий новгород': 'Великий Новгород', 'нижний новгород': 'Нижний Новгород',
  'набережные челны': 'Набережные Челны', 'йошкар-ола': 'Йошкар-Ола', 'ростов-на-дону': 'Ростов-на-Дону'
};

var STATUS_MAP = {
  'ДС': { available_without_assembly: true, available_with_assembly: true },
  'Д': { available_without_assembly: true, available_with_assembly: false },
  'С': { available_without_assembly: false, available_with_assembly: true },
  'X': { available_without_assembly: false, available_with_assembly: false },
  'Х': { available_without_assembly: false, available_with_assembly: false }
};

function toCanonicalDirection(name) {
  var lower = (name || '').toString().trim().toLowerCase();
  if (DIRECTION_ALIAS[lower]) return DIRECTION_ALIAS[lower];
  for (var key in DIRECTION_ALIAS) {
    if (lower.indexOf(key) >= 0 || key.indexOf(lower) >= 0) return DIRECTION_ALIAS[key];
  }
  return (name || '').toString().trim();
}

function isDateCell(c) {
  return c && typeof c === 'object' && typeof c.getMonth === 'function';
}

function extractDayFromDate(dateCell) {
  if (!isDateCell(dateCell)) return null;
  var d = dateCell.getDate();
  return (d >= 1 && d <= 31) ? d : null;
}

function extractDayNumber(val) {
  if (val == null || val === '') return null;
  var d = extractDayFromDate(val);
  if (d != null) return d;
  var n = parseInt(val, 10);
  if (!isNaN(n) && n >= 1 && n <= 31) return n;
  var s = (val || '').toString().trim();
  var m = s.match(/^(\d{1,2})[.\s]/) || s.match(/^(\d{1,2})$/);
  if (m) {
    var d2 = parseInt(m[1], 10);
    if (d2 >= 1 && d2 <= 31) return d2;
  }
  return null;
}

function isMonthHeader(cell) {
  var s = (cell || '').toString().trim();
  if (!s) return null;
  var m = s.match(/^(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)\s*(\d{4})?$/i);
  if (m) {
    var year = m[2] ? parseInt(m[2], 10) : new Date().getFullYear();
    return { month: m[1].toLowerCase(), year: year };
  }
  return null;
}

function isDayNamesRow(cells) {
  if (!cells || cells.length < 3) return false;
  var matchCount = 0;
  for (var i = 0; i < cells.length; i++) {
    var s = (cells[i] || '').toString().trim();
    if (DAY_NAMES_PATTERN.test(s) || s === '') matchCount++;
  }
  return matchCount >= Math.min(5, cells.length);
}

function isEmptyRow(row) {
  if (!row || row.length === 0) return true;
  for (var i = 0; i < row.length; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

function normalizeStatus(s) {
  var t = (s || '').toString().trim().toUpperCase();
  return VALID_STATUS.test(t) ? t : null;
}

function processSheetRows(rows) {
  var blocks = [];
  var i = 0;

  while (i < rows.length) {
    var row = rows[i];
    if (isEmptyRow(row)) { i++; continue; }

    var monthInfo = isMonthHeader(row[0]);
    if (!monthInfo) { i++; continue; }

    var dayNumbers = [];
    var year = null;
    var monthNum = null;
    for (var j = 1; j < row.length; j++) {
      var d = extractDayFromDate(row[j]);
      if (d != null) {
        dayNumbers.push(d);
        if (year == null && isDateCell(row[j])) {
          year = row[j].getFullYear();
          monthNum = row[j].getMonth() + 1;
        }
      } else if (dayNumbers.length > 0) break;
    }

    if (dayNumbers.length === 0 || year == null || monthNum == null) { i++; continue; }

    i++;
    if (i < rows.length && isDayNamesRow(rows[i])) i++;

    var dataRows = [];
    while (i < rows.length) {
      var r = rows[i];
      if (isEmptyRow(r)) { i++; continue; }
      if (isMonthHeader(r[0])) break;
      if (!r || r.length < 2) { i++; break; }

      var direction = (r[0] || '').toString().trim();
      if (!direction) { i++; continue; }

      var statusCells = [];
      for (var s = 1; s < 1 + dayNumbers.length && s < r.length; s++) {
        var st = normalizeStatus(r[s]);
        if (st) statusCells.push(st);
      }
      if (statusCells.length !== dayNumbers.length) { i++; continue; }

      dataRows.push({ direction: toCanonicalDirection(direction), statuses: statusCells });
      i++;
    }

    blocks.push({ month: monthInfo.month, year: year, monthNum: monthNum, dayNumbers: dayNumbers, dataRows: dataRows });
  }

  return blocks;
}

function blocksToRows(blocks) {
  var rows = [];
  for (var b = 0; b < blocks.length; b++) {
    var block = blocks[b];
    var pad = function(n) { return (n < 10 ? '0' : '') + n; };
    for (var r = 0; r < block.dataRows.length; r++) {
      var dr = block.dataRows[r];
      for (var j = 0; j < block.dayNumbers.length; j++) {
        var iso = block.year + '-' + pad(block.monthNum) + '-' + pad(block.dayNumbers[j]);
        var status = dr.statuses[j].toUpperCase();
        var flags = STATUS_MAP[status] || { available_without_assembly: false, available_with_assembly: false };
        rows.push({
          city_name: dr.direction,
          delivery_date: iso,
          available_without_assembly: flags.available_without_assembly,
          available_with_assembly: flags.available_with_assembly,
          raw_status: status
        });
      }
    }
  }
  return rows;
}

function runDeliverySync() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SYNC_URL');
  var secret = props.getProperty('SYNC_SECRET');
  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  var dryRun = props.getProperty('DRY_RUN') !== 'false';

  if (!url || !secret) {
    Logger.log('SYNC_URL or SYNC_SECRET not set in Script Properties');
    return;
  }

  var ss;
  if (spreadsheetId) {
    if (spreadsheetId.indexOf('http') === 0) {
      ss = SpreadsheetApp.openByUrl(spreadsheetId);
    } else {
      ss = SpreadsheetApp.openById(spreadsheetId);
    }
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var allBlocks = [];
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var values = sheets[i].getDataRange().getValues();
    var blocks = processSheetRows(values);
    allBlocks = allBlocks.concat(blocks);
  }

  allBlocks.sort(function(a, b) {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNum - b.monthNum;
  });

  var rows = blocksToRows(allBlocks);
  if (rows.length === 0) {
    Logger.log('No rows extracted from sheet');
    return;
  }

  var payload = JSON.stringify({ rows: rows, dry_run: dryRun });
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    headers: { 'X-Sync-Secret': secret },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  Logger.log('sync-delivery: ' + code + ' ' + body);
  if (code >= 400) {
    Logger.log('sync-delivery failed: ' + body);
  }
}
