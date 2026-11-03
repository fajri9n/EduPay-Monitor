/**
 * Ekspor data array object ke file CSV yang kompatibel dengan Microsoft Excel (dengan BOM UTF-8)
 * @param {Array<Object>} data Array data
 * @param {Array<{ key: string, label: string, formatter?: Function }>} columns Definisi kolom
 * @param {string} filename Nama file hasil download (tanpa .csv)
 */
export function exportToCsv(data, columns, filename = 'export-data') {
  if (!data || !data.length) {
    alert('Tidak ada data yang dapat diekspor.');
    return;
  }

  // Header row
  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Body rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let value = item[col.key];
        if (col.formatter && typeof col.formatter === 'function') {
          value = col.formatter(value, item);
        }
        if (value === null || value === undefined) {
          value = '';
        }
        // Escape quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

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

