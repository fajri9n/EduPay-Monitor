/**
 * Ekspor data array object ke file CSV yang kompatibel dengan Microsoft Excel (dengan BOM UTF-8)
 * Mendukung fleksibilitas argumen:
 * 1. exportToCsv(data, columns, filename)
 * 2. exportToCsv(filename, data)
 * 3. exportToCsv(data, filename)
 */
export function exportToCsv(arg1, arg2, arg3) {
  let filename = 'export-data';
  let data = [];
  let columns = null;

  if (typeof arg1 === 'string') {
    // Dipanggil sebagai exportToCsv(filename, data)
    filename = arg1;
    data = Array.isArray(arg2) ? arg2 : [];
  } else if (Array.isArray(arg1)) {
    data = arg1;
    if (Array.isArray(arg2)) {
      // Dipanggil sebagai exportToCsv(data, columns, filename)
      columns = arg2;
      filename = typeof arg3 === 'string' ? arg3 : 'export-data';
    } else if (typeof arg2 === 'string') {
      // Dipanggil sebagai exportToCsv(data, filename)
      filename = arg2;
    }
  }

  if (!data || !data.length) {
    alert('Tidak ada data yang dapat diekspor.');
    return;
  }

  let headers = '';
  let rows = [];

  // Jika kolom didefinisikan secara eksplisit dengan format [{ key, label, formatter }]
  if (columns && Array.isArray(columns) && columns[0]?.key) {
    headers = columns
      .map((col) => `"${String(col.label || col.key).replace(/"/g, '""')}"`)
      .join(',');

    rows = data.map((item) => {
      return columns
        .map((col) => {
          let value = item[col.key];
          if (col.formatter && typeof col.formatter === 'function') {
            value = col.formatter(value, item);
          }
          if (value === null || value === undefined) {
            value = '';
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',');
    });
  } else {
    // Otomatis ekstrak dari key-key object
    const keys = Object.keys(data[0]);
    headers = keys.map((k) => `"${String(k).replace(/"/g, '""')}"`).join(',');

    rows = data.map((item) => {
      return keys
        .map((k) => {
          const value = item[k];
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        })
        .join(',');
    });
  }

  // UTF-8 BOM agar terbaca rapi di Microsoft Excel (karakter Indonesia & format Rp)
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
