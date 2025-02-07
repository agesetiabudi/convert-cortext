import React, { useState, useRef } from "react";
import styles from "../styles/Homepage.module.css";

export default function HomePage() {
    const [file, setFile] = useState(null);
    const [downloadPath, setDownloadPath] = useState("");
    const [active, setActive] = useState("keluaran");

    // Buat referensi ke input file
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    // Handler untuk drag & drop file
    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Fungsi untuk membuka file picker saat container diklik
    const handleClickUpload = () => {
        fileInputRef.current.click();
    };

    const handleProcess = async () => {
        if (!file) {
            alert("Please select a file first!");
            return;
        }

        // Kirimkan file sebagai objek atau buffer
        let result;
        if(active == 'keluaran'){
            result = await window.ipc.invoke("process-spending", {
                name: file.name,
                buffer: await file.arrayBuffer(),
            });
        }else{
            result = await window.ipc.invoke("process-ebupot", {
                name: file.name,
                buffer: await file.arrayBuffer(),
            });
        }

        if (result.success) {
            console.log("File processed successfully:", result.outputPath);
            alert("File Berhasil di proses !");
        } else {
            console.error("Error processing file:", result.error);
            alert("File yang anda upload terdapat kesalahan");
        }

        setFile(null)
    };

    const handleDownload = () => {
        if (downloadPath) {
            // const link = document.createElement("a");
            // link.href = `file://${downloadPath}`;
            // link.download = "updated_file.xlsx";
            // link.click();
            alert("Please select a file first!");
        }
    };

    return (
        <div className={styles.container}>
            <h2>Apps Converter CoreTax</h2>
            <div className={styles.containerSub}>
                <div className={styles.containerCategory}>
                    <button className={`${styles.button} ${active === "keluaran" && styles.active}`} onClick={() => setActive("keluaran")}>
                        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M35 55.4167H17.5C15.1794 55.4167 12.9538 54.4948 11.3128 52.8538C9.67187 51.2129 8.75 48.9873 8.75 46.6667V23.3333C8.75 21.0127 9.67187 18.7871 11.3128 17.1461C12.9538 15.5052 15.1794 14.5833 17.5 14.5833H52.5C54.8206 14.5833 57.0462 15.5052 58.6872 17.1461C60.3281 18.7871 61.25 21.0127 61.25 23.3333V36.4583"
                                stroke={active == "keluaran" ? "#442C9E" : "#A2A2A2"}
                                stroke-width="5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path d="M8.75 29.1667H61.25" stroke={active == "keluaran" ? "#442C9E" : "#A2A2A2"} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M20.4167 43.75H20.4459" stroke={active == "keluaran" ? "#442C9E" : "#A2A2A2"} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M32.0833 43.75H37.9166" stroke={active == "keluaran" ? "#442C9E" : "#A2A2A2"} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M46.6667 55.4167H64.1667" stroke={active == "keluaran" ? "#442C9E" : "#A2A2A2"} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M55.4167 46.6667L46.6667 55.4167L55.4167 64.1667" stroke={active == "keluaran" ? "#442C9E" : "#A2A2A2"} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <br />
                        <div className={styles.label}>Keluaran & Masukan</div>
                    </button>
                    <button className={`${styles.button} ${active !== "keluaran" && styles.active}`} onClick={() => setActive("bufot")}>
                        <svg width="58" height="47" viewBox="0 0 58 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 14.6667L14.6667 3M14.6667 3L26.3333 14.6667M14.6667 3V43.8333" stroke={active != "keluaran" ? "#442C9E" : "#A2A2A2"} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M55.5 32.1667L43.8334 43.8333M43.8334 43.8333L32.1667 32.1667M43.8334 43.8333V3" stroke={active != "keluaran" ? "#442C9E" : "#A2A2A2"} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <br />
                        <div className={styles.label}>Ebupot</div>
                    </button>
                </div>

                {/* Upload Container dengan Klik */}
                <div className={styles.uploadContainer} onDrop={handleDrop} onDragOver={handleDragOver} onClick={handleClickUpload}>
                    {/* Hidden File Input */}
                    <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} ref={fileInputRef} className={styles.hiddenFileInput} />
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_1_39)">
                            <path
                                d="M29.1667 6.25V14.5833C29.1667 15.1359 29.3862 15.6658 29.7769 16.0565C30.1676 16.4472 30.6975 16.6667 31.25 16.6667H39.5834"
                                stroke="#5D5D5D"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M10.4167 25V10.4167C10.4167 9.3116 10.8557 8.25179 11.6371 7.47039C12.4185 6.68899 13.4783 6.25 14.5834 6.25H29.1667L39.5834 16.6667V25"
                                stroke="#5D5D5D"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path d="M8.33331 31.25L16.6666 43.75" stroke="#5D5D5D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M8.33331 43.75L16.6666 31.25" stroke="#5D5D5D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                                d="M35.4167 42.1875C35.4167 43.05 36.1167 43.75 36.9792 43.75H39.5834C40.1359 43.75 40.6658 43.5305 41.0565 43.1398C41.4472 42.7491 41.6667 42.2192 41.6667 41.6667V39.5833C41.6667 39.0308 41.4472 38.5009 41.0565 38.1102C40.6658 37.7195 40.1359 37.5 39.5834 37.5H37.5C36.9475 37.5 36.4176 37.2805 36.0269 36.8898C35.6362 36.4991 35.4167 35.9692 35.4167 35.4167V33.3333C35.4167 32.7808 35.6362 32.2509 36.0269 31.8602C36.4176 31.4695 36.9475 31.25 37.5 31.25H40.1042C40.5186 31.25 40.916 31.4146 41.209 31.7076C41.5021 32.0007 41.6667 32.3981 41.6667 32.8125"
                                stroke="#5D5D5D"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path d="M22.9167 31.25V43.75H29.1667" stroke="#5D5D5D" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        </g>
                        <defs>
                            <clipPath id="clip0_1_39">
                                <rect width="50" height="50" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                    <p className={styles.uploadText}>{file ? `File dipilih: ${file.name}` : "Drag & Drop atau klik untuk upload file"}</p>
                </div>

                <div className={styles.buttonContainer}>
                    <button className={styles.buttonCancel} onClick={() => setFile(null)}>
                        Cancel
                    </button>
                    <button className={styles.buttonSubmit} onClick={handleProcess}>
                        Proses File
                    </button>
                </div>

                {/* {downloadPath && (
                    <div className={styles.downloadContainer}>
                        <p>
                            File telah diproses! <button onClick={handleDownload}>Download File</button>
                        </p>
                    </div>
                )} */}
            </div>
        </div>
    );
}
