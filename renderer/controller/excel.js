import XLSX from 'xlsx';

export const processExcel = (inputPath) => {
  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const updatedData = data.map((row, index) => (
    console.log(row)
  ));

  // Buat file Excel baru
  // const newWorkbook = XLSX.utils.book_new();
  // const newSheet = XLSX.utils.json_to_sheet(updatedData);
  // XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'UpdatedData');

  // // Tentukan path output
  // const outputPath = path.join(__dirname, '..', 'output', 'updated_file.xlsx');

  // // Simpan file baru
  // XLSX.writeFile(newWorkbook, outputPath);

  return outputPath;
};
