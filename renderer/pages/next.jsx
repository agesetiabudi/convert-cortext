import React from 'react';
import styles from '../styles/Homepage.module.css';

export default function HomePage() {
  const [file, setFile] = React.useState(null);
  const [downloadPath, setDownloadPath] = React.useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleProcess = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }
  
    // Kirimkan file sebagai objek atau buffer
    const result = await window.ipc.invoke('process-spending', {
      name: file.name,
      buffer: await file.arrayBuffer(),
    });
  
    if (result.success) {
      console.log('File processed successfully:', result.outputPath);
      setDownloadPath(result.outputPath);
    } else {
      console.error('Error processing file:', result.error);
    }
  };

  const handleDownload = () => {
    if (downloadPath) {
      const link = document.createElement('a');
      link.href = `file://${downloadPath}`;
      link.download = 'updated_file.xlsx';
      link.click();
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Excel Converter</h1>
      <input
        type="file"
        accept=".xls,.xlsx"
        className={styles.fileInput}
        onChange={handleFileChange}
      />
      <button className={styles.button} onClick={handleProcess}>
        Process File
      </button>
      {downloadPath && (
        <button
          className={`${styles.button} ${styles.downloadButton}`}
        >
          Berhasil menkonversi data silahkan masuk ke {downloadPath}
        </button>
      )}
    </div>
  );
}
