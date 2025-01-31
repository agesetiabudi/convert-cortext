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

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Tambah 1 karena bulan dimulai dari 0
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateCombinedXML = (data) => {
  let xmlContent = `<?xml version="1.0" encoding="utf-8" ?>\n`;
  xmlContent += `<TaxInvoiceBulk xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="TaxInvoice.xsd">\n`;
  xmlContent += `\t<TIN>0818414054424000</TIN>\n`;
  xmlContent += `\t<ListOfTaxInvoice>\n`;
  
  

  let goodsBuffer = [];
  let currentTaxInvoice = null;
  let currentDPP  = 0;

  const closeTaxInvoice = (xmlContent, currentTaxInvoice, goodsBuffer, currentDPP) => {
    if (!currentTaxInvoice) return xmlContent;

    xmlContent += `\t\t\t<ListOfGoodService>\n`;
    goodsBuffer.forEach((good) => {
      let DPP   = good.DPP
      let DPPL  = (11 / 12) * DPP; // Hitung DPPL
      let ppn   = (DPPL * 12) / 100; // Hitung PPN
    
      // Format nilai numerik menjadi string
      DPPL = DPPL.toFixed(2);
      ppn = ppn.toFixed(2);

      xmlContent += `\t\t\t\t<GoodService>\n`;
      xmlContent += `\t\t\t\t\t<Opt>A</Opt>\n`;
      xmlContent += `\t\t\t\t\t<Code>${good.Code || ""}</Code>\n`;
      xmlContent += `\t\t\t\t\t<Name>${good.Name || "Barang"}</Name>\n`;
      xmlContent += `\t\t\t\t\t<Unit>UM.0018</Unit>\n`;
      xmlContent += `\t\t\t\t\t<Price>${good.Price || "0.00"}</Price>\n`;
      xmlContent += `\t\t\t\t\t<Qty>${good.Qty || "0.00"}</Qty>\n`;
      xmlContent += `\t\t\t\t\t<TotalDiscount>${good.Discon || "0.00"}</TotalDiscount>\n`;
      xmlContent += `\t\t\t\t\t<TaxBase>${DPP || "0.00"}</TaxBase>\n`;
      xmlContent += `\t\t\t\t\t<OtherTaxBase>${DPPL}</OtherTaxBase>\n`;
      xmlContent += `\t\t\t\t\t<VATRate>12</VATRate>\n`;
      xmlContent += `\t\t\t\t\t<VAT>${ppn}</VAT>\n`;
      xmlContent += `\t\t\t\t\t<STLGRate>0</STLGRate>\n`;
      xmlContent += `\t\t\t\t\t<STLG>0.00</STLG>\n`;
      xmlContent += `\t\t\t\t</GoodService>\n`;
    });
    xmlContent += `\t\t\t</ListOfGoodService>\n`;
    xmlContent += `\t\t</TaxInvoice>\n`;
  
    return xmlContent;
  };
  
  data.forEach((row) => {
    if (row.FK === "FK") {
      let buyername           = row.NAMA.match(/\D+$/)?.[0].trim();
      let BuyerAdress         = row.ALAMAT_LENGKAP;
      let buyerNPWP           = /^\d{16}$/.test(row.NPWP) ? row.NPWP : "0000000000000000";
      let faktureDate         = row.TANGGAL_FAKTUR
      let referensi           = row.REFERENSI

      let [day, month, year]  = faktureDate.split("/"); 
      let dateObj             = new Date(`${year}-${month}-${day}`);
      let formattedDate       = dateObj.toISOString().split("T")[0];

      let typeDocsBuyer = "Other ID";
      if (buyerNPWP != "0000000000000000") {
        typeDocsBuyer = "TIN";
      }
  
      xmlContent = closeTaxInvoice(xmlContent, currentTaxInvoice, goodsBuffer, currentDPP);
  
      currentTaxInvoice = row;
      goodsBuffer = [];

      xmlContent += `\t\t<TaxInvoice>\n`;
      xmlContent += `\t\t\t<TaxInvoiceDate>${formattedDate}</TaxInvoiceDate>\n`;
      xmlContent += `\t\t\t<TaxInvoiceOpt>Normal</TaxInvoiceOpt>\n`;
      xmlContent += `\t\t\t<TrxCode>04</TrxCode>\n`;
      xmlContent += `\t\t\t<AddInfo/>\n`;
      xmlContent += `\t\t\t<CustomDoc/>\n`;
      xmlContent += `\t\t\t<RefDesc>${referensi}</RefDesc>\n`;
      xmlContent += `\t\t\t<FacilityStamp>TD.01105</FacilityStamp>\n`;
      xmlContent += `\t\t\t<SellerIDTKU>0818414054424000000000</SellerIDTKU>\n`;
      xmlContent += `\t\t\t<BuyerTin>${'0000000000000000'}</BuyerTin>\n`;
      xmlContent += `\t\t\t<BuyerDocument>Other ID</BuyerDocument>\n`;
      xmlContent += `\t\t\t<BuyerCountry>IDN</BuyerCountry>\n`;
      xmlContent += `\t\t\t<BuyerDocumentNumber>-</BuyerDocumentNumber>\n`;
      xmlContent += `\t\t\t<BuyerName>${buyername}</BuyerName>\n`;
      xmlContent += `\t\t\t<BuyerAdress>${BuyerAdress}</BuyerAdress>\n`;
      xmlContent += `\t\t\t<BuyerEmail>${buyername?.toLowerCase()?.replace(/\s+/g, '')}@gmail.com</BuyerEmail>\n`;
      xmlContent += `\t\t\t<BuyerIDTKU>0</BuyerIDTKU>\n`;
    } else if (row.FK === "OF") {
      goodsBuffer.push({
        // Code    : row.FG_PENGGANTI.match(/^\d+/)?.[0] || "",
        Code    : "",
        Name    : row.FG_PENGGANTI.replace(/^\d+\s+\d+\s+\w+\s+X\d+\s+/, "") || "",
        Price   : row.NOMOR_FAKTUR,
        Qty     : row.MASA_PAJAK,
        Discon  : row.TANGGAL_FAKTUR,
        DPP     : row.NPWP
      });
    }
  });
  
  // Tutup faktur terakhir
  xmlContent = closeTaxInvoice(xmlContent, currentTaxInvoice, goodsBuffer, currentDPP);
  

  xmlContent += `\t</ListOfTaxInvoice>\n`;
  xmlContent += `</TaxInvoiceBulk>\n`;

  return xmlContent;
};


// Handle Excel processing in main process
ipcMain.handle('process-excel', async (_event, file) => {
  try {
    const tempPath = path.join(app.getPath('temp'), file.name);
    fs.writeFileSync(tempPath, Buffer.from(file.buffer));

    const workbook = XLSX.readFile(tempPath);
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const xmlContent = generateCombinedXML(sheetData.slice(2));
    const documentsPath = path.join(os.homedir(), 'Documents', 'cortext');
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }
    
    const fileNameWithoutExt = path.basename(file.name, path.extname(file.name));
    
    // Simpan XML dengan nama yang sama
    const outputFilePath = path.join(documentsPath, `${fileNameWithoutExt}.xml`);
    fs.writeFileSync(outputFilePath, xmlContent, 'utf-8');

    return { success: true, outputPath: outputFilePath };
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
