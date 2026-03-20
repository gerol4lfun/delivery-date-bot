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
 * Структура листа:
 *   - строка: "Март 2026" (месяц + год)
 *   - строка: номера дней (14 15 16 ...)
 *   - строка: дни недели (Пн Вт Ср ...) — пропускается
 *   - строки: направление + статусы X/ДС/Д/С
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

function extractDayNumber(val) {
  if (val == null || val === '') return null;
  var n = parseInt(val, 10);
  if (!isNaN(n) && n >= 1 && n <= 31) return n;
  var s = (val || '').toString().trim();
  var m = s.match(/^(\d{1,2})[.\s]/) || s.match(/^(\d{1,2})$/);
  if (m) {
    var d = parseInt(m[1], 10);
    if (d >= 1 && d <= 31) return d;
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

function normalizeStatus(s) {
  var t = (s || '').toString().trim().toUpperCase();
  return VALID_STATUS.test(t) ? t : null;
}

function processSheetRows(rows) {
  var blocks = [];
  var i = 0;

  while (i < rows.length) {
    var row = rows[i];
    if (!row || row.length === 0) { i++; continue; }

    var monthInfo = null;
    for (var c = 0; c < row.length; c++) {
      monthInfo = isMonthHeader(row[c]);
      if (monthInfo) break;
    }
    if (i < 5) {
      var fc = row[0];
      Logger.log('DEBUG Row' + i + ' firstCell="' + (fc + '') + '" type=' + typeof fc + ' monthFound=' + !!monthInfo);
      if (monthInfo) Logger.log('  -> month: ' + monthInfo.month + ' ' + monthInfo.year);
    }
    if (!monthInfo) { i++; continue; }

    var year = monthInfo.year;
    var monthNum = MONTH_NAMES.indexOf(monthInfo.month) + 1;
    if (monthNum < 1) { i++; continue; }

    i++;
    if (i >= rows.length) break;

    var daysRow = rows[i];
    var dayNumbers = [];
    if (daysRow) {
      for (var j = 0; j < daysRow.length; j++) {
        var d = extractDayNumber(daysRow[j]);
        if (d != null) dayNumbers.push(d);
        else if (dayNumbers.length > 0) break;
      }
    }

    if (dayNumbers.length === 0 && i + 1 < rows.length && isDayNamesRow(rows[i])) {
      i++;
      daysRow = rows[i];
      if (daysRow) {
        for (var j = 0; j < daysRow.length; j++) {
          var d = extractDayNumber(daysRow[j]);
          if (d != null) dayNumbers.push(d);
          else if (dayNumbers.length > 0) break;
        }
      }
    }

    if (dayNumbers.length === 0) {
      Logger.log('DEBUG: month found row' + (i - 1) + ', daysRow row' + i + ' dayNumbers=0 vals=' + JSON.stringify((daysRow || []).slice(0, 5)));
      i++;
      continue;
    }
    i++;

    if (i < rows.length && isDayNamesRow(rows[i])) i++;

    var dataRows = [];
    while (i < rows.length) {
      var r = rows[i];
      if (!r || r.length < 2) { i++; break; }

      var directionEnd = -1;
      for (var k = 0; k < r.length; k++) {
        if (normalizeStatus(r[k])) { directionEnd = k; break; }
      }
      if (directionEnd < 0) { i++; break; }

      var dirParts = [];
      for (var p = 0; p < directionEnd; p++) dirParts.push((r[p] || '').toString().trim());
      var direction = dirParts.join(' ').trim();
      if (!direction) { i++; continue; }

      var statusCells = [];
      for (var s = directionEnd; s < r.length; s++) {
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
  if (sheets.length > 0) {
    var values0 = sheets[0].getDataRange().getValues();
    Logger.log('DEBUG: Sheet "' + sheets[0].getName() + '" rows=' + values0.length);
    for (var r = 0; r < Math.min(8, values0.length); r++) {
      var preview = values0[r].map(function(c) {
        if (c && typeof c === 'object' && c.getMonth) return '[Date]';
        return (c === null || c === undefined) ? '' : (c + '').substring(0, 30);
      });
      Logger.log('DEBUG Row' + r + ': ' + JSON.stringify(preview));
    }
  }
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
