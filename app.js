document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfoBox = document.getElementById('file-info-box');
    const selectedFileName = document.getElementById('selected-file-name');
    const selectedFileSize = document.getElementById('selected-file-size');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    
    const progressContainer = document.getElementById('progress-container');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressStage = document.getElementById('progress-stage');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const statusMessage = document.getElementById('status-message');
    
    const actionPanel = document.getElementById('action-panel');
    const btnReset = document.getElementById('btn-reset');
    const btnDownload = document.getElementById('btn-download');
    
    const previewSection = document.getElementById('preview-section');
    const parsedHtmlOutput = document.getElementById('parsed-html-output');
    const hwpxHtmlOutput = document.getElementById('hwpx-html-output');

    // State Variables
    let selectedFile = null;
    let zipInstance = null;
    let documentStyles = { charProperties: {}, paraProperties: {}, binDataMap: {} };
    let manifestItems = {};

    // -------------------------------------------------------------
    // 1. DRAG AND DROP & FILE INPUT HANDLERS
    // -------------------------------------------------------------
    
    // Trigger file selection dialog on click
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Keyboard interaction
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // File input change handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag-over styling effects
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    // Remove file handler
    btnRemoveFile.addEventListener('click', (e) => {
        e.stopPropagation();
        resetAppState();
    });

    // Reset application state
    btnReset.addEventListener('click', () => {
        resetAppState();
    });

    // -------------------------------------------------------------
    // 2. STATE MANAGER
    // -------------------------------------------------------------
    function handleFileSelection(file) {
        // Validate file extension
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'hwpx' && ext !== 'docx') {
            alert('올바른 HWPX 또는 DOCX 파일을 선택해주세요. (.hwpx, .docx 파일만 지원합니다)');
            return;
        }

        selectedFile = file;
        
        // Show file details
        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = formatBytes(file.size);
        
        dropZone.style.display = 'none';
        fileInfoBox.style.display = 'flex';
        progressContainer.style.display = 'flex';
        
        // Start Local Extraction & Parsing
        processFile(file);
    }

    function resetAppState() {
        selectedFile = null;
        zipInstance = null;
        documentStyles = { charProperties: {}, paraProperties: {}, binDataMap: {} };
        manifestItems = {};
        
        fileInput.value = '';
        progressBarFill.style.width = '0%';
        progressPercentage.textContent = '0%';
        progressStage.textContent = '대기 중...';
        statusMessage.textContent = '';
        statusMessage.style.color = 'var(--text-secondary)';
        
        dropZone.style.display = 'flex';
        fileInfoBox.style.display = 'none';
        progressContainer.style.display = 'none';
        actionPanel.style.display = 'none';
        previewSection.style.display = 'none';
        parsedHtmlOutput.innerHTML = '';
        hwpxHtmlOutput.innerHTML = '';
    }

    function updateProgress(percentage, stageText) {
        progressBarFill.style.width = percentage + '%';
        progressPercentage.textContent = percentage + '%';
        progressStage.textContent = stageText;
    }

    function setSuccessState(msg) {
        statusMessage.textContent = msg;
        statusMessage.style.color = 'var(--success-color)';
        progressStage.textContent = '완료';
        actionPanel.style.display = 'flex';
    }

    function setErrorState(msg) {
        statusMessage.textContent = msg;
        statusMessage.style.color = 'var(--error-color)';
        progressStage.textContent = '오류 발생';
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // -------------------------------------------------------------
    // 3. HWPX EXTRACTION & PARSING CORE ENGINE
    // -------------------------------------------------------------
    async function processFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (ext === 'docx') {
            try {
                updateProgress(20, 'DOCX 파일을 로컬 브라우저로 분석 중...');
                
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        
                        // Parse DOCX locally using Mammoth
                        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                        const html = result.value;
                        
                        // Clear outputs
                        parsedHtmlOutput.innerHTML = '';
                        hwpxHtmlOutput.innerHTML = '';
                        
                        // Set layout HTML content
                        parsedHtmlOutput.innerHTML = html;
                        hwpxHtmlOutput.innerHTML = html;
                        
                        // Update Left viewer title dynamically
                        document.getElementById('left-viewer-title').innerHTML = '<i class="fa-regular fa-file-word" aria-hidden="true"></i> DOCX 디지털 뷰어';
                        
                        updateProgress(100, '모든 연산이 안전하게 완료되었습니다.');
                        setSuccessState('사용자 브라우저 내에서 DOCX 변환이 안전하게 완료되었습니다. 미리보기를 확인하세요.');
                        previewSection.style.display = 'flex';
                    } catch (err) {
                        console.error(err);
                        setErrorState('DOCX 파일 파싱 중 오류가 발생했습니다: ' + err.message);
                    }
                };
                
                reader.onerror = (err) => {
                    console.error(err);
                    setErrorState('파일을 읽어들이는 과정에서 오류가 발생했습니다.');
                };
            } catch (error) {
                console.error(error);
                setErrorState('DOCX 문서 처리 중 알 수 없는 오류가 발생했습니다.');
            }
        } else {
            // HWPX Parser
            try {
                updateProgress(10, '파일 아카이브 압축 해제 중...');
                
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        zipInstance = await JSZip.loadAsync(arrayBuffer);
                        
                        updateProgress(30, '패키지 명세서(Manifest) 분석 중...');
                        await parseManifest();
                        
                        updateProgress(50, '문서 스타일 정보 파싱 중...');
                        await parseStyles();
                        
                        updateProgress(70, '문서 본문 내용 파싱 및 변환 중...');
                        await parseContent();
                        
                        // Update Left viewer title dynamically
                        document.getElementById('left-viewer-title').innerHTML = '<i class="fa-regular fa-file-lines" aria-hidden="true"></i> HWPX 디지털 뷰어';
                        
                        updateProgress(100, '모든 연산이 안전하게 완료되었습니다.');
                        setSuccessState('사용자 브라우저 내에서 HWPX 변환이 안전하게 완료되었습니다. 미리보기를 확인하세요.');
                        previewSection.style.display = 'flex';
                    } catch (err) {
                        console.error(err);
                        setErrorState('HWPX 파일 압축을 푸는 도중 오류가 발생했습니다: ' + err.message);
                    }
                };

                reader.onerror = (err) => {
                    console.error(err);
                    setErrorState('파일을 읽어들이는 과정에서 오류가 발생했습니다.');
                };

            } catch (error) {
                console.error(error);
                setErrorState('문서 처리 중 알 수 없는 치명적인 오류가 발생했습니다.');
            }
        }
    }

    // 3.2 Parse Contents/content.hpf (Package Manifest)
    async function parseManifest() {
        const manifestFile = zipInstance.file('Contents/content.hpf');
        if (!manifestFile) {
            // Check in root directory as fallback
            const rootManifest = zipInstance.file('content.hpf');
            if (!rootManifest) return;
        }

        const xmlText = await (manifestFile || zipInstance.file('content.hpf')).async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Find all <item> elements
        const items = xmlDoc.querySelectorAll('item, opf\\:item');
        items.forEach(item => {
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            if (id && href) {
                manifestItems[id] = href;
            }
        });
    }

    // 3.3 Parse Contents/header.xml (Styles, fonts, alignment mapping)
    async function parseStyles() {
        const headerFile = zipInstance.file('Contents/header.xml');
        if (!headerFile) return;

        const xmlText = await headerFile.async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // 1. Character properties (<hp:charPr> or <hh:charPr>)
        const charPrs = xmlDoc.querySelectorAll('charPr, hh\\:charPr, hp\\:charPr');
        charPrs.forEach(charPr => {
            const id = charPr.getAttribute('id');
            if (!id) return;

            const height = charPr.getAttribute('height');
            
            // Check for bold (as attribute or child element)
            let bold = charPr.getAttribute('bold') === '1' || charPr.getAttribute('bold') === 'true';
            if (!bold) {
                const boldEl = charPr.querySelector('bold, hp\\:bold, hh\\:bold');
                if (boldEl) bold = boldEl.getAttribute('val') !== '0';
            }

            // Check for italic (as attribute or child element)
            let italic = charPr.getAttribute('italic') === '1' || charPr.getAttribute('italic') === 'true';
            if (!italic) {
                const italicEl = charPr.querySelector('italic, hp\\:italic, hh\\:italic');
                if (italicEl) italic = italicEl.getAttribute('val') !== '0';
            }

            // Text color
            const textColor = charPr.getAttribute('textColor');
            
            // Underline settings
            const underlineType = charPr.getAttribute('underlineType');
            const underline = underlineType && underlineType !== 'none';

            // Check for letter spacing (자간)
            let spacing = 0;
            const spacingAttr = charPr.getAttribute('spacing');
            if (spacingAttr) {
                spacing = parseInt(spacingAttr, 10);
            } else {
                const spacingEl = charPr.querySelector('spacing, hp\\:spacing, hh\\:spacing');
                if (spacingEl) {
                    const userSpacing = spacingEl.getAttribute('user') || spacingEl.getAttribute('hangul') || spacingEl.getAttribute('latin') || spacingEl.getAttribute('value');
                    if (userSpacing) {
                        spacing = parseInt(userSpacing, 10);
                    }
                }
            }

            documentStyles.charProperties[id] = {
                height: height ? parseInt(height, 10) : null,
                bold: bold,
                italic: italic,
                underline: underline,
                textColor: textColor && textColor.startsWith('#') ? textColor : (textColor ? '#' + textColor : null),
                spacing: spacing
            };
        });

        // 2. Paragraph properties (<hp:paraPr> or <hh:paraPr>)
        const paraPrs = xmlDoc.querySelectorAll('paraPr, hh\\:paraPr, hp\\:paraPr');
        paraPrs.forEach(paraPr => {
            const id = paraPr.getAttribute('id');
            if (!id) return;

            const alignEl = paraPr.querySelector('align, hh\\:align, hp\\:align');
            let align = 'left';
            if (alignEl) {
                const horz = alignEl.getAttribute('horizontal');
                if (horz === 'CENTER') align = 'center';
                else if (horz === 'RIGHT') align = 'right';
                else if (horz === 'JUSTIFY') align = 'justify';
            }

            documentStyles.paraProperties[id] = { align };
        });

        // 3. Binary data mappings (<hp:binDataList>)
        const binDatas = xmlDoc.querySelectorAll('binData, hh\\:binData, hp\\:binData');
        binDatas.forEach(binData => {
            const id = binData.getAttribute('id');
            const rId = binData.getAttribute('rId') || binData.getAttribute('binaryItemID') || binData.getAttribute('href') || binData.getAttribute('path');
            if (id && rId) {
                documentStyles.binDataMap[id] = rId;
            }
        });
    }

    // 3.4 Parse Contents/section0.xml (Document body, text, tables, images)
    async function parseContent() {
        // Clear previous output
        parsedHtmlOutput.innerHTML = '';
        hwpxHtmlOutput.innerHTML = '';
        
        // Find section files
        // We look up section XMLs listed in manifest. If not found, fall back to default section0.xml
        let sectionPaths = [];
        
        // Standard check
        const section0 = zipInstance.file('Contents/section0.xml');
        if (section0) {
            sectionPaths.push('Contents/section0.xml');
            
            // Check for additional sections incrementally (section1.xml, section2.xml...)
            let sIdx = 1;
            while (zipInstance.file(`Contents/section${sIdx}.xml`)) {
                sectionPaths.push(`Contents/section${sIdx}.xml`);
                sIdx++;
            }
        } else {
            // Deep search all files in the ZIP ending in section*.xml
            const entries = Object.keys(zipInstance.files);
            const matchingSecs = entries.filter(name => /section\d+\.xml$/i.test(name));
            if (matchingSecs.length > 0) {
                // Sort numerically to preserve document spine order
                matchingSecs.sort((a, b) => {
                    const numA = parseInt((a.match(/\d+/) || [0])[0], 10);
                    const numB = parseInt((b.match(/\d+/) || [0])[0], 10);
                    return numA - numB;
                });
                sectionPaths = matchingSecs;
            }
        }

        if (sectionPaths.length === 0) {
            throw new Error('문서 본문 내용(section XML)을 찾을 수 없습니다.');
        }

        // Process sections sequentially
        for (const sectionPath of sectionPaths) {
            const xmlText = await zipInstance.file(sectionPath).async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Render section contents
            await renderXmlBody(xmlDoc.documentElement, parsedHtmlOutput);
        }

        // Sync to left HWPX digital viewer
        hwpxHtmlOutput.innerHTML = parsedHtmlOutput.innerHTML;
    }

    // Recursively parse elements in body XML and generate beautiful equivalent HTML components
    async function renderXmlBody(xmlNode, htmlContainer) {
        const childNodes = xmlNode.childNodes;
        
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            
            if (child.nodeType !== Node.ELEMENT_NODE) continue;
            
            const tagName = child.localName;
            
            if (tagName === 'p') {
                // 1. Paragraph
                const pEl = document.createElement('p');
                
                // Read paragraph property ID ref
                const paraPrIDRef = child.getAttribute('paraPrIDRef');
                if (paraPrIDRef && documentStyles.paraProperties[paraPrIDRef]) {
                    pEl.style.textAlign = documentStyles.paraProperties[paraPrIDRef].align;
                }
                
                // Recursively parse children inside paragraph
                await renderXmlBody(child, pEl);
                htmlContainer.appendChild(pEl);
                
            } else if (tagName === 'run') {
                // 2. Text Run
                const spanEl = document.createElement('span');
                
                // Read character property styling ID ref
                const charPrIDRef = child.getAttribute('charPrIDRef');
                if (charPrIDRef && documentStyles.charProperties[charPrIDRef]) {
                    const style = documentStyles.charProperties[charPrIDRef];
                    
                    if (style.height) {
                        spanEl.style.fontSize = (style.height / 100) + 'pt';
                    }
                    if (style.bold) {
                        spanEl.style.fontWeight = 'bold';
                    }
                    if (style.italic) {
                        spanEl.style.fontStyle = 'italic';
                    }
                    if (style.underline) {
                        spanEl.style.textDecoration = 'underline';
                    }
                    if (style.textColor) {
                        spanEl.style.color = style.textColor;
                    }
                    if (style.spacing) {
                        spanEl.style.letterSpacing = (style.spacing / 100) + 'em';
                    }
                }
                
                // Parse text inside run
                await renderXmlBody(child, spanEl);
                htmlContainer.appendChild(spanEl);
                
            } else if (tagName === 't') {
                // 3. Text content
                const innerNodes = child.childNodes;
                for (let k = 0; k < innerNodes.length; k++) {
                    const node = innerNodes[k];
                    if (node.nodeType === Node.TEXT_NODE) {
                        htmlContainer.appendChild(document.createTextNode(node.nodeValue));
                    } else if (node.nodeType === Node.ELEMENT_NODE && node.localName === 'lineBreak') {
                        htmlContainer.appendChild(document.createElement('br'));
                    }
                }
                
            } else if (tagName === 'tbl') {
                // 4. Tables
                const tableEl = document.createElement('table');
                
                // Parse rows
                const rows = child.querySelectorAll('tr, hp\\:tr, hh\\:tr');
                for (let r = 0; r < rows.length; r++) {
                    const rowEl = document.createElement('tr');
                    const cells = rows[r].children;
                    
                    for (let c = 0; c < cells.length; c++) {
                        const cell = cells[c];
                        if (cell.localName !== 'tc') continue;
                        
                        const tdEl = document.createElement('td');
                        
                        // Parse colspan and rowspan details from cellSpan
                        const span = cell.querySelector('cellSpan, hp\\:cellSpan, hh\\:cellSpan');
                        if (span) {
                            const colSpan = span.getAttribute('colSpan');
                            const rowSpan = span.getAttribute('rowSpan');
                            if (colSpan && colSpan !== '1') tdEl.colSpan = parseInt(colSpan, 10);
                            if (rowSpan && rowSpan !== '1') tdEl.rowSpan = parseInt(rowSpan, 10);
                        }
                        
                        // Parse cell inside contents container (<hp:subList>)
                        const subList = cell.querySelector('subList, hp\\:subList, hh\\:subList');
                        if (subList) {
                            await renderXmlBody(subList, tdEl);
                        } else {
                            await renderXmlBody(cell, tdEl);
                        }
                        
                        rowEl.appendChild(tdEl);
                    }
                    tableEl.appendChild(rowEl);
                }
                htmlContainer.appendChild(tableEl);
                
            } else if (tagName === 'pic' || tagName === 'picture' || tagName === 'img') {
                // 5. Embedded Binary Images (Checks any tag with IDRef pointing to BinData)
                let binDataIDRef = null;
                
                // Inspect parent and all descendants for any binData/binaryitem reference attribute
                const checkElementAttrs = (el) => {
                    for (let attr of el.attributes) {
                        const name = attr.name.toLowerCase();
                        if (name.includes('bindataidref') || name.includes('binaryitemidref') || name.endsWith('idref')) {
                            return attr.value;
                        }
                    }
                    return null;
                };

                binDataIDRef = checkElementAttrs(child);
                if (!binDataIDRef) {
                    const subElements = child.querySelectorAll('*');
                    for (let el of subElements) {
                        const ref = checkElementAttrs(el);
                        if (ref) {
                            binDataIDRef = ref;
                            break;
                        }
                    }
                }
                
                if (binDataIDRef) {
                    try {
                        const base64Url = await getEmbeddedBinaryUrl(binDataIDRef);
                        if (base64Url) {
                            const imgEl = document.createElement('img');
                            imgEl.src = base64Url;
                            imgEl.alt = 'Embedded Image';
                            htmlContainer.appendChild(imgEl);
                        }
                    } catch (e) {
                        console.error('이미지 로딩 에러:', e);
                    }
                }
                
            } else {
                // Fallback traversal for structural elements like subList, sec, body, etc.
                await renderXmlBody(child, htmlContainer);
            }
        }
    }

    // High-resilient retriever of image binary content inside ZIP archive, converting to data URLs
    async function getEmbeddedBinaryUrl(binDataIDRef) {
        const cleanID = binDataIDRef.trim();

        // 1. Resolve rId from header map
        let rId = documentStyles.binDataMap[cleanID];
        if (!rId) {
            rId = cleanID.startsWith('binData') ? cleanID : 'binData' + cleanID;
        }

        // 2. Resolve target filepath inside ZIP using rId
        let href = manifestItems[rId] || manifestItems[cleanID];
        
        // 3. Robust fallback matching if manifest mapping is incomplete
        if (!href) {
            const allFiles = Object.keys(zipInstance.files);
            const binDataFiles = allFiles.filter(name => name.toLowerCase().includes('bindata/'));
            binDataFiles.sort();

            const digitMatch = cleanID.match(/\d+/);
            if (digitMatch) {
                const num = parseInt(digitMatch[0], 10);
                const paddedStr = digitMatch[0].padStart(4, '0');
                const matchedByPadding = binDataFiles.find(name => name.toLowerCase().includes('bindata' + paddedStr));
                if (matchedByPadding) {
                    href = matchedByPadding;
                } else {
                    // Index-based fallback
                    if (num < binDataFiles.length) {
                        href = binDataFiles[num];
                    } else if (num - 1 >= 0 && num - 1 < binDataFiles.length) {
                        href = binDataFiles[num - 1];
                    }
                }
            }

            if (!href) {
                const matchedFile = binDataFiles.find(name => 
                    name.toLowerCase().includes(cleanID.toLowerCase())
                );
                if (matchedFile) href = matchedFile;
            }
        }

        if (!href) return null;

        // Path normalizer
        if (!href.startsWith('Contents/') && zipInstance.file('Contents/' + href)) {
            href = 'Contents/' + href;
        }

        const fileEntry = zipInstance.file(href);
        if (!fileEntry) return null;

        // Extract binary blob and read as Data URL
        const blob = await fileEntry.async('blob');
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    // -------------------------------------------------------------
    // 4. PDF GENERATOR & EXPORTER
    // -------------------------------------------------------------
    btnDownload.addEventListener('click', () => {
        if (!selectedFile || !parsedHtmlOutput.innerHTML) {
            alert('변환할 문서 데이터가 존재하지 않습니다.');
            return;
        }

        // Add visual loading indicator on button
        btnDownload.disabled = true;
        const origContent = btnDownload.innerHTML;
        btnDownload.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> PDF 생성 중...';

        const pdfFileName = selectedFile.name.replace(/\.[^/.]+$/, "") + ".pdf";

        // Setup PDF rendering parameters
        // A4 page is exactly 210mm x 297mm. Using html2pdf, we set A4 layout
        const opt = {
            margin: 0,
            filename: pdfFileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                backgroundColor: '#ffffff'
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // Export parsed HTML container directly to local user PDF
        html2pdf()
            .set(opt)
            .from(parsedHtmlOutput)
            .save()
            .then(() => {
                // Reset visual indicator
                btnDownload.disabled = false;
                btnDownload.innerHTML = origContent;
            })
            .catch((error) => {
                console.error(error);
                alert('PDF 파일 생성 중 오류가 발생했습니다: ' + error.message);
                btnDownload.disabled = false;
                btnDownload.innerHTML = origContent;
            });
    });
});
