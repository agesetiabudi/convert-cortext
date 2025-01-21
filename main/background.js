import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import XLSX from 'xlsx';
import fs from 'fs';
import os from 'os';
import archiver from 'archiver';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

const generateXMLForRow = (row, goods) => {
  let xmlContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
  xmlContent += `<TaxInvoiceBulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="TaxInvoice.xsd">\n`;
  xmlContent += `\t<TIN>${row["NPWP/NIK Pembeli"] || "xxxxxxxxxxxxxxxx"}</TIN>\n`;
  xmlContent += `\t<ListOfTaxInvoice>\n`;
  xmlContent += `\t\t<TaxInvoice>\n`;
  xmlContent += `\t\t\t<TaxInvoiceDate>${row["Tanggal Faktur"]}</TaxInvoiceDate>\n`;
  xmlContent += `\t\t\t<TaxInvoiceOpt>${row["Jenis Faktur"]}</TaxInvoiceOpt>\n`;
  xmlContent += `\t\t\t<TrxCode>${row["Kode Transaksi"]}</TrxCode>\n`;
  xmlContent += `\t\t\t<AddInfo/>\n`;
  xmlContent += `\t\t\t<CustomDoc/>\n`;
  xmlContent += `\t\t\t<RefDesc/>\n`;
  xmlContent += `\t\t\t<FacilityStamp/>\n`;
  xmlContent += `\t\t\t<SellerIDTKU>${row["ID TKU Penjual"] || "0000000000000000000000"}</SellerIDTKU>\n`;
  xmlContent += `\t\t\t<BuyerTin>${row["NPWP/NIK Pembeli"]}</BuyerTin>\n`;
  xmlContent += `\t\t\t<BuyerDocument>${row["Jenis ID Pembeli"]}</BuyerDocument>\n`;
  xmlContent += `\t\t\t<BuyerCountry>${row["Negara Pembeli"] || "IND"}</BuyerCountry>\n`;
  xmlContent += `\t\t\t<BuyerDocumentNumber/>\n`;
  xmlContent += `\t\t\t<BuyerName>${row["Nama Pembeli"] || ""}</BuyerName>\n`;
  xmlContent += `\t\t\t<BuyerAdress>${row["Alamat Pembeli"] || ""}</BuyerAdress>\n`;
  xmlContent += `\t\t\t<BuyerEmail>${row["Email Pembeli"] || ""}</BuyerEmail>\n`;
  xmlContent += `\t\t\t<BuyerIDTKU>${row["ID TKU Pembeli"] || "0000000000000000000000"}</BuyerIDTKU>\n`;
  xmlContent += `\t\t\t<ListOfGoodService>\n`;

  goods.forEach((good) => {
    xmlContent += `\t\t\t\t<GoodService>\n`;
    xmlContent += `\t\t\t\t\t<Opt>${good["Barang/Jasa"]}</Opt>\n`;
    xmlContent += `\t\t\t\t\t<Code>${good["Kode Barang Jasa"]}</Code>\n`;
    xmlContent += `\t\t\t\t\t<Name>${good["Nama Barang"] || "Barang"}</Name>\n`;
    xmlContent += `\t\t\t\t\t<Unit>${good["Nama Satuan Ukur"] || "UM.0001"}</Unit>\n`;
    xmlContent += `\t\t\t\t\t<Price>${good["Harga Satuan"]}</Price>\n`;
    xmlContent += `\t\t\t\t\t<Qty>${good["Jumlah Barang Jasa"]}</Qty>\n`;
    xmlContent += `\t\t\t\t\t<TotalDiscount>${good["Total Diskon"]}</TotalDiscount>\n`;
    xmlContent += `\t\t\t\t\t<TaxBase>${good["DPP"]}</TaxBase>\n`;
    xmlContent += `\t\t\t\t\t<OtherTaxBase>${good["DPP Nilai Lain"] || ""}</OtherTaxBase>\n`;
    xmlContent += `\t\t\t\t\t<VATRate>${good["Tarif PPN"]}</VATRate>\n`;
    xmlContent += `\t\t\t\t\t<VAT>${good["PPN"]}</VAT>\n`;
    xmlContent += `\t\t\t\t\t<STLGRate>${good["Tarif PPnBM"]}</STLGRate>\n`;
    xmlContent += `\t\t\t\t\t<STLG>${good["PPnBM"]}</STLG>\n`;
    xmlContent += `\t\t\t\t</GoodService>\n`;
  });

  xmlContent += `\t\t\t</ListOfGoodService>\n`;
  xmlContent += `\t\t</TaxInvoice>\n`;
  xmlContent += `\t</ListOfTaxInvoice>\n`;
  xmlContent += `</TaxInvoiceBulk>\n`;

  return xmlContent;
};

const saveAllXMLAsZip = (fakturData, detailFakturData, outputZipPath) => {
  const zip = fs.createWriteStream(outputZipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(zip);

  fakturData.forEach((row, index) => {
    const goods = detailFakturData.filter((good) => good["Baris"] === row["Baris"]);
    const xmlContent = generateXMLForRow(row, goods);
    archive.append(xmlContent, { name: `TaxInvoice_${index + 1}.xml` });
  });

  archive.finalize();
};


// Handle Excel processing in main process
ipcMain.handle('process-excel', async (_event, file) => {
  try {
    const tempPath = path.join(app.getPath('temp'), file.name);
    const workBook = XLSX.utils.book_new();

    fs.writeFileSync(tempPath, Buffer.from(file.buffer));

    const workbook = XLSX.readFile(tempPath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Modifikasi data
    let currentNPWP       = "";
    let currentNama       = "";
    let currentDateFaktur = "";
    let counterData       = 1;
    let currentNIK        = "";

    const fakturData = data
      .slice(2)
      .map((row, index) => {
        if (row.KD_JENIS_TRANSAKSI == "04") {
          currentNIK        = row.NAMA.match(/\d{16}/)?.[0] || "";
          currentNPWP       = row.NPWP;
          currentNama       = row.NAMA.match(/\D+$/)?.[0].trim() || "";
          currentDateFaktur = row.TANGGAL_FAKTUR || "";
        }

        if (row.FK === "FK" || row.KD_JENIS_TRANSAKSI == "04") {
          return null; // Skip baris FK dan 04
        }

        // Tentukan nomor dokumen pembeli
        let nomorDokumenPembeli = "-"; // Default untuk TIN
        if (row.JENIS_ID_PEMBELI === "National ID") {
          nomorDokumenPembeli = row.NOMOR_DOKUMEN || "";
        } else if (row.JENIS_ID_PEMBELI === "Other ID") {
          nomorDokumenPembeli = row.NOMOR_DOKUMEN || "";
        }

        return {
          "Baris": counterData++,
          "Tanggal Faktur": currentDateFaktur,
          "Jenis Faktur": "Normal",
          "Kode Transaksi": row.KD_JENIS_TRANSAKSI || "",
          "Keterangan Tambahan": "",
          "Dokumen Pendukung": "",
          "Referensi": row.REFERENSI || "",
          "Cap Fasilitas": "TD.01101",
          "ID TKU Penjual": "",
          "NPWP/NIK Pembeli": currentNPWP == "000000000000000" ? currentNIK : currentNPWP,
          "Jenis ID Pembeli": currentNPWP === "000000000000000" ? (currentNIK ? "National ID" : "Other ID") : "TIN",
          "Negara Pembeli": "IDN",
          "Nomor Dokumen Pembeli": nomorDokumenPembeli,
          "Nama Pembeli": currentNama, // Gunakan Nama yang disimpan dari FK 04
          "Alamat Pembeli": "",
          "Email Pembeli": `${currentNama.toLowerCase()}@gmail.com`,
          "ID TKU Pembeli": "000000",
        };
      }).filter((row) => row !== null);

    let countingDetailFaktur = 1;    
    const detailFakturData = data.slice(2)
    .map((row, index) => {
      
      if (row.FK === "FK" || row.KD_JENIS_TRANSAKSI == "04") {
        return null; // Skip baris FK dan 04
      }

      let DPP                  = row.TAHUN_PAJAK * row.NOMOR_FAKTUR - row.TANGGAL_FAKTUR;

      return {
        "Baris"               : countingDetailFaktur++,
        "Barang/Jasa"         : "A",
        "Kode Barang Jasa"    : row.FG_PENGGANTI.match(/^\d+/)?.[0] || "",
        "Nama Satuan Ukur"    : "UM.0021",
        "Harga Satuan"        : row.NOMOR_FAKTUR,
        "Jumlah Barang Jasa"  : row.MASA_PAJAK,
        "Total Diskon"        : row.TANGGAL_FAKTUR,
        "DPP"                 : DPP,
        "DPP Nilai Lain"      : "",
        "Tarif PPN"           : 12,
        "PPN"                 : DPP * 12 / 100,
        "Tarif PPnBM"         : 0,
        "PPnBM"               : "0,00"
      }
    }).filter((row) => row !== null);
      
    const fakturSheet = XLSX.utils.json_to_sheet(fakturData);
    XLSX.utils.book_append_sheet(workBook, fakturSheet, 'Faktur');

    const detailFakturSheet = XLSX.utils.json_to_sheet(detailFakturData);
    XLSX.utils.book_append_sheet(workBook, detailFakturSheet , 'DetailFaktur')

    const documentsPath = path.join(os.homedir(), 'Documents', 'cortext');
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now
      .getHours()
      .toString()
      .padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;
    const outputFileName = `updated_${timestamp}.xlsx`;
    const outputPath = path.join(documentsPath, outputFileName);
    XLSX.writeFile(workBook, outputPath);

    const outputZipPath = path.join(documentsPath, "TaxInvoices.zip");
    saveAllXMLAsZip(fakturData, detailFakturData, outputZipPath);

    return { success: true, outputPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

// Sample message handler
ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});
