
            // Highlight active nav item on scroll
            document.addEventListener('DOMContentLoaded', () => {
                const sections = document.querySelectorAll('section[id]');
                const navLinks = document.querySelectorAll('nav span[data-section], .mobile-nav-item[data-section]');

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const id = entry.target.id;
                            navLinks.forEach(link => {
                                link.classList.remove('text-brand-blue');
                                link.classList.add('text-gray-600');
                            });
                            const active = document.querySelector(`[data-section="${id}"]`);
                            if (active) {
                                active.classList.add('text-brand-blue');
                                active.classList.remove('text-gray-600');
                            }
                        }
                    });
                }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

                sections.forEach(s => observer.observe(s));
            });

            const webAppUrl = "https://script.google.com/macros/s/AKfycbwyoxaULc3mCR1E-VH3k15OyASG4iM9bOqsR1d-MzkHJswWWUDyrNSXhGfNdu1Pj3_r/exec";

            let currentLang = localStorage.getItem('lang') || 'EN';
            let cmsTexts = {};
            let smartImages = {};
            let translations = {};
            let fallbackBooks = {};
            let localImagesMap = {};

            async function initExcelAndImages() {
                try {
                    // 1. Fetch and Parse data.xlsx with cache buster query parameter
                    const excelResponse = await fetch('data.xlsx?t=' + Date.now());
                    if (!excelResponse.ok) throw new Error("Failed to fetch data.xlsx: " + excelResponse.status);
                    const excelBuffer = await excelResponse.arrayBuffer();
                    const workbook = XLSX.read(excelBuffer, { type: 'array' });

                    // Parse Translations
                    const transSheet = workbook.Sheets['Translations'];
                    if (transSheet) {
                        const transRows = XLSX.utils.sheet_to_json(transSheet);
                        translations = {}; // reset
                        transRows.forEach(row => {
                            translations[row.Key] = {
                                "EN": row.EN || "",
                                "BN": row.BN || ""
                            };
                        });
                    }

                    // Parse FallbackBooks
                    const booksSheet = workbook.Sheets['FallbackBooks'];
                    if (booksSheet) {
                        const booksRows = XLSX.utils.sheet_to_json(booksSheet);
                        fallbackBooks = {}; // reset
                        booksRows.forEach(row => {
                            const { BookId, Lang, PageIdx, Side, Type, Title, Context, Author, Text, Verse, Num } = row;
                            if (!fallbackBooks[BookId]) fallbackBooks[BookId] = {};
                            if (!fallbackBooks[BookId][Lang]) fallbackBooks[BookId][Lang] = { pages: [] };

                            const pagesArray = fallbackBooks[BookId][Lang].pages;
                            const idx = parseInt(PageIdx);
                            while (pagesArray.length <= idx) {
                                pagesArray.push({ front: {}, back: {} });
                            }

                            pagesArray[idx][Side] = {
                                type: Type || "",
                                title: Title || "",
                                context: Context || "",
                                author: Author || "",
                                text: Text || "",
                                verse: Verse || "",
                                num: Num || ""
                            };
                        });
                    }

                    // 2. Fetch and Parse images.bin with cache buster query parameter
                    const binResponse = await fetch('images.bin?t=' + Date.now());
                    if (!binResponse.ok) throw new Error("Failed to fetch images.bin: " + binResponse.status);
                    const binBuffer = await binResponse.arrayBuffer();
                    const view = new DataView(binBuffer);

                    let offset = 0;
                    if (binBuffer.byteLength >= 4) {
                        const fileCount = view.getUint32(offset, true);
                        offset += 4;

                        const files = [];
                        for (let i = 0; i < fileCount; i++) {
                            if (offset + 1 > binBuffer.byteLength) break;
                            const nameLen = view.getUint8(offset);
                            offset += 1;

                            if (offset + nameLen > binBuffer.byteLength) break;
                            const nameBytes = new Uint8Array(binBuffer, offset, nameLen);
                            const filename = new TextDecoder().decode(nameBytes);
                            offset += nameLen;

                            if (offset + 4 > binBuffer.byteLength) break;
                            const fileSize = view.getUint32(offset, true);
                            offset += 4;

                            files.push({ filename, size: fileSize });
                        }

                        for (const file of files) {
                            if (offset + file.size <= binBuffer.byteLength) {
                                const dataBytes = new Uint8Array(binBuffer, offset, file.size);
                                offset += file.size;

                                let mimeType = 'image/png';
                                if (file.filename.endsWith('.jpg') || file.filename.endsWith('.jpeg')) {
                                    mimeType = 'image/jpeg';
                                } else if (file.filename.endsWith('.webp')) {
                                    mimeType = 'image/webp';
                                }

                                const blob = new Blob([dataBytes], { type: mimeType });
                                localImagesMap[file.filename] = URL.createObjectURL(blob);
                            }
                        }
                    }
                    console.log("data.xlsx and images.bin successfully loaded.");
                } catch (e) {
                    console.error("Local data load error (CORS or missing files):", e);
                }

                updatePageContent();
                triggerInitialImages();
            }

            function triggerInitialImages() {
                const imgPhoto1 = document.getElementById('img-Photo1');
                const imgPhoto5 = document.getElementById('img-Photo5');
                if (imgPhoto1) getLocalImagePath('Hero', imgPhoto1);
                if (imgPhoto5) getLocalImagePath('Photo5', imgPhoto5);
            }

            function toggleLangDropdown() {
                const dropdown = document.getElementById('lang-dropdown');
                const arrow = document.getElementById('lang-arrow');
                if (dropdown) {
                    if (dropdown.classList.contains('hidden')) {
                        dropdown.classList.remove('hidden');
                        dropdown.classList.add('flex');
                        if (arrow) arrow.style.transform = 'rotate(180deg)';
                    } else {
                        dropdown.classList.add('hidden');
                        dropdown.classList.remove('flex');
                        if (arrow) arrow.style.transform = '';
                    }
                }
            }

            function changeLanguage(lang) {
                currentLang = lang;
                localStorage.setItem('lang', currentLang);
                updatePageContent();
                const dropdown = document.getElementById('lang-dropdown');
                const arrow = document.getElementById('lang-arrow');
                if (dropdown) {
                    dropdown.classList.add('hidden');
                    dropdown.classList.remove('flex');
                }
                if (arrow) arrow.style.transform = '';
            }

            // Close language dropdown if clicked outside
            window.addEventListener('click', function (e) {
                const dropdown = document.getElementById('lang-dropdown');
                const btn = document.getElementById('lang-btn');
                const arrow = document.getElementById('lang-arrow');
                if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
                    dropdown.classList.add('hidden');
                    dropdown.classList.remove('flex');
                    if (arrow) arrow.style.transform = '';
                }
            });

            function updatePageContent() {
                const langBtnText = document.getElementById('lang-btn-text');
                if (langBtnText) {
                    langBtnText.innerText = currentLang;
                }

                // Update dropdown checkmarks
                const checkEn = document.getElementById('check-en');
                const checkBn = document.getElementById('check-bn');
                if (checkEn && checkBn) {
                    if (currentLang === 'EN') {
                        checkEn.classList.remove('hidden');
                        checkBn.classList.add('hidden');
                    } else {
                        checkEn.classList.add('hidden');
                        checkBn.classList.remove('hidden');
                    }
                }

                document.querySelectorAll('[data-translate]').forEach(el => {
                    const key = el.getAttribute('data-translate');
                    if (translations[key]) {
                        el.innerHTML = translations[key][currentLang];
                    }
                });

                document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
                    const key = el.getAttribute('data-translate-placeholder');
                    if (translations[key]) {
                        el.placeholder = translations[key][currentLang];
                    }
                });

                for (let key in cmsTexts) {
                    let el = document.getElementById(key);
                    if (el) {
                        let val = cmsTexts[key];
                        if (currentLang === 'BN' && translations[key]) {
                            val = translations[key]['BN'];
                        } else if (currentLang === 'EN' && translations[key]) {
                            val = translations[key]['EN'];
                        }

                        if (key === 'footer_email') {
                            el.innerHTML = val;
                            el.href = "mailto:" + val;
                        } else {
                            el.innerHTML = val;
                        }
                    }

                    if (key.includes('_pct')) {
                        let bar = document.getElementById(key + '_bar');
                        if (bar) bar.style.width = (cmsTexts[key] * 100) + '%';
                    }
                }

                renderProjects();

                let bookBN = document.getElementById('book-bengali-edition');
                let bookEN = document.getElementById('book-english-edition');
                if (bookBN && bookEN) {
                    if (currentLang === 'BN') {
                        bookBN.classList.remove('hidden');
                        bookEN.classList.add('hidden');
                    } else {
                        bookBN.classList.add('hidden');
                        bookEN.classList.remove('hidden');
                    }
                }

                let book2BN = document.getElementById('book-2-bengali-edition');
                let book2EN = document.getElementById('book-2-english-edition');
                if (book2BN && book2EN) {
                    if (currentLang === 'BN') {
                        book2BN.classList.remove('hidden');
                        book2EN.classList.add('hidden');
                    } else {
                        book2BN.classList.add('hidden');
                        book2EN.classList.remove('hidden');
                    }
                }
            }

            function getLocalImagePath(baseName, imgElement) {
                if (!imgElement) return;
                const extensions = ['.png', '.jpg', '.jpeg', '.webp'];

                // Try to find image in loaded binary images first
                let found = false;
                for (const ext of extensions) {
                    const key = baseName + ext;
                    if (localImagesMap[key]) {
                        imgElement.src = localImagesMap[key];
                        found = true;
                        break;
                    }
                }

                if (found) {
                    imgElement.style.display = 'block';
                    const err = imgElement.parentElement.querySelector('.error-box');
                    if (err) err.remove();
                    return;
                }

                // Direct file system fallback
                let attemptIndex = 0;
                function tryNext() {
                    if (attemptIndex < extensions.length) {
                        const ext = extensions[attemptIndex++];
                        imgElement.src = baseName + ext;
                    } else {
                        handleMissingImage(imgElement, baseName);
                    }
                }

                imgElement.onload = () => {
                    imgElement.style.display = 'block';
                    const err = imgElement.parentElement.querySelector('.error-box');
                    if (err) err.remove();
                };

                imgElement.onerror = () => {
                    tryNext();
                };

                tryNext();
            }

            function renderProjects() {
                const projectsContainer = document.getElementById('projects-container');
                if (!projectsContainer) return;
                projectsContainer.innerHTML = '';

                let projectKeys = ['Photo2', 'Photo3', 'Photo4'];
                let allCardsHTML = '';

                projectKeys.forEach(imgKey => {
                    let num = imgKey.replace('Photo', '');

                    let titleKey = `project${num}_title`;
                    let descKey = `project${num}_desc`;

                    let title = (cmsTexts && cmsTexts[titleKey]) ? cmsTexts[titleKey] : `Project ${num}`;
                    let desc = (cmsTexts && cmsTexts[descKey]) ? cmsTexts[descKey] : `Details for Project ${num}`;

                    if (currentLang === 'BN') {
                        if (translations[titleKey]) title = translations[titleKey]['BN'];
                        if (translations[descKey]) desc = translations[descKey]['BN'];
                    } else {
                        if (translations[titleKey]) title = translations[titleKey]['EN'];
                        if (translations[descKey]) desc = translations[descKey]['EN'];
                    }

                    let isInovace = title.toLowerCase().includes('inovace');

                    // Map each photo key to its logo file
                    const logoMap = {
                        'Photo2': 'Companies logos/Inovace Technologies.png',
                        'Photo3': 'Companies logos/Sunan Prokashoni.png',
                        'Photo4': null  // no logo file for Electronics & PC Services
                    };
                    const logoSrc = logoMap[imgKey] || null;
                    const logoHTML = logoSrc
                        ? `<div class="inline-block bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 shadow-lg transition duration-500 ${isInovace ? 'group-hover:opacity-0' : ''}">
                             <img src="${logoSrc}" alt="${title} logo" class="h-8 object-contain" style="max-width:130px;">
                           </div>`
                        : `<h3 class="font-heading text-4xl md:text-5xl uppercase relative z-10 w-full leading-none drop-shadow-lg transition duration-500 ${isInovace ? 'group-hover:opacity-0' : ''}">${title}</h3>`;

                    // CANVA 16:9 FIX: Changed aspect ratio to 'aspect-video' (16:9)
                    let cardHTML = `
                    <div class="group cursor-pointer bg-brand-black text-white relative overflow-hidden aspect-video flex flex-col justify-between p-6 shadow-md border border-gray-800 rounded-lg"
                         ${isInovace ? 'onmouseenter="const v = this.querySelector(\'video\'); if(v) v.play();" onmouseleave="const v = this.querySelector(\'video\'); if(v) { v.pause(); }"' : ''}>
                        <img id="img-${imgKey}" src="" alt="${title}" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500 z-0 ${isInovace ? 'group-hover:opacity-0' : ''}">
                        ${isInovace ? '<video src="Videos/Inovace Life.mp4" class="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-500 z-20 pointer-events-none group-hover:pointer-events-auto [&:fullscreen]:opacity-100 [&:fullscreen]:pointer-events-auto [&:-webkit-full-screen]:opacity-100 [&:-webkit-full-screen]:pointer-events-auto [&:-moz-full-screen]:opacity-100 [&:-moz-full-screen]:pointer-events-auto" muted controls controlsList="nodownload" playsinline></video>' : ''}
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-10 pointer-events-none transition duration-500 ${isInovace ? 'group-hover:opacity-0' : ''}"></div>
                        <div class="relative z-10 mt-auto mb-4">
                            ${logoHTML}
                        </div>
                        <div class="relative z-10 flex justify-between items-end text-[10px] uppercase tracking-widest font-semibold text-gray-300 drop-shadow-md transition duration-500 ${isInovace ? 'group-hover:opacity-0' : ''}">
                            <span>${desc}</span>
                        </div>
                    </div>
                `;
                    allCardsHTML += cardHTML;
                });

                projectsContainer.innerHTML = allCardsHTML;

                // Load local image on the stable DOM nodes
                projectKeys.forEach(imgKey => {
                    let imgEl = document.getElementById(`img-${imgKey}`);
                    if (imgEl) {
                        getLocalImagePath(imgKey, imgEl);
                    }
                });
            }

            // ==============================================
            // INDEXEDDB FOR PDF FILE PERSISTENCE
            // ==============================================
            const dbName = "custom_books_db";
            const storeName = "books";
            let db = null;

            function initDB() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(dbName, 1);
                    request.onupgradeneeded = (e) => {
                        const database = e.target.result;
                        if (!database.objectStoreNames.contains(storeName)) {
                            database.createObjectStore(storeName, { keyPath: "id" });
                        }
                    };
                    request.onsuccess = (e) => {
                        db = e.target.result;
                        resolve(db);
                    };
                    request.onerror = (e) => {
                        console.error("IndexedDB open error:", e.target.error);
                        reject(e.target.error);
                    };
                });
            }

            function saveBookToDB(book) {
                return new Promise((resolve, reject) => {
                    if (!db) return reject("Database not initialized");
                    const transaction = db.transaction([storeName], "readwrite");
                    const store = transaction.objectStore(storeName);
                    const request = store.put(book);
                    request.onsuccess = () => resolve();
                    request.onerror = (e) => reject(e.target.error);
                });
            }

            function getBookFromDB(id) {
                return new Promise((resolve, reject) => {
                    if (!db) return reject("Database not initialized");
                    const transaction = db.transaction([storeName], "readonly");
                    const store = transaction.objectStore(storeName);
                    const request = store.get(id);
                    request.onsuccess = (e) => resolve(e.target.result);
                    request.onerror = (e) => reject(e.target.error);
                });
            }

            function getAllBooksFromDB() {
                return new Promise((resolve, reject) => {
                    if (!db) return reject("Database not initialized");
                    const transaction = db.transaction([storeName], "readonly");
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();
                    request.onsuccess = (e) => resolve(e.target.result || []);
                    request.onerror = (e) => reject(e.target.error);
                });
            }

            function deleteBookFromDB(id) {
                return new Promise((resolve, reject) => {
                    if (!db) return reject("Database not initialized");
                    const transaction = db.transaction([storeName], "readwrite");
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(id);
                    request.onsuccess = () => resolve();
                    request.onerror = (e) => reject(e.target.error);
                });
            }

            // Memory cache of PDF data/blobs to avoid re-reading from IndexedDB
            let uploadedBooksCache = {};

            async function loadCustomBooks() {
                try {
                    await initDB();
                    const books = await getAllBooksFromDB();
                    const container = document.getElementById("custom-books-container");
                    const section = document.getElementById("custom-books-section");

                    if (!container) return;
                    container.innerHTML = "";

                    if (books.length === 0) {
                        section.classList.add("hidden");
                        return;
                    }

                    section.classList.remove("hidden");

                    for (const book of books) {
                        const blob = new Blob([book.data], { type: "application/pdf" });
                        const blobUrl = URL.createObjectURL(blob);
                        uploadedBooksCache[book.id] = {
                            arrayBuffer: book.data,
                            blobUrl: blobUrl,
                            title: book.title
                        };

                        const cardHTML = createBookCardHTML(book.id, book.title, blobUrl, book.addedAt, book.size);
                        container.insertAdjacentHTML("beforeend", cardHTML);

                        const canvas = document.getElementById(`cover-${book.id}`);
                        if (canvas) {
                            renderPDFCover(book.data, canvas);
                        }
                    }

                    updatePageContent();

                } catch (err) {
                    console.error("Error loading custom books:", err);
                }
            }

            function createBookCardHTML(id, title, pdfBlobUrl, date, size) {
                const formattedDate = new Date(date).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                });

                const sizeKb = (size / 1024).toFixed(1);
                const formattedSize = `${sizeKb} KB`;

                return `
                <div id="book-card-${id}" class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div class="lg:col-span-4 flex justify-center py-6">
                        <div class="book-container-3d">
                            <div class="book-mockup">
                                <div class="book-spine"></div>
                                <div class="book-cover flex flex-col justify-between p-6 overflow-hidden relative" style="background: linear-gradient(135deg, #0f172a, #0b1121);">
                                    <canvas id="cover-${id}" class="absolute inset-0 w-full h-full object-cover z-0 opacity-70"></canvas>
                                    <div class="book-cover-content relative z-10 flex flex-col justify-between h-full text-center">
                                        <div class="text-[10px] font-bold uppercase tracking-widest text-sky-300" data-translate="custom_badge">Uploaded Book</div>
                                        <h3 class="text-white text-base font-bold leading-tight my-auto px-2 break-all">${title}</h3>
                                        <div class="text-[9px] text-gray-400 font-semibold tracking-wider" data-translate="custom_author">External PDF</div>
                                    </div>
                                </div>
                                <div class="book-pages"></div>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-8 flex flex-col justify-center">
                        <span class="bg-blue-50 text-brand-blue text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 w-fit rounded-full mb-4" data-translate="custom_badge">Uploaded Book</span>
                        <h2 class="text-3xl md:text-4xl font-bold uppercase text-brand-black leading-tight mb-4 break-words">
                            ${title}
                        </h2>
                        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-6 flex flex-wrap gap-x-4 gap-y-2">
                            <span><span data-translate="custom_author">Author: External PDF</span></span>
                            <span>•</span>
                            <span><span data-translate="custom_year">Uploaded: </span>${formattedDate}</span>
                            <span>•</span>
                            <span>${formattedSize}</span>
                        </p>

                        <div class="flex flex-col sm:flex-row gap-4 mt-4">
                            <a href="${pdfBlobUrl}" target="_blank"
                                class="bg-brand-black text-white text-xs font-bold uppercase tracking-widest py-4 px-8 hover:bg-brand-blue transition duration-300 flex items-center justify-center gap-3 shadow-md">
                                <span data-translate="btn_pdf">Read PDF Version</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2"
                                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z">
                                    </path>
                                </svg>
                            </a>
                            <button onclick="open3DBook('${id}', 'BN')"
                                class="bg-brand-blue text-white text-xs font-bold uppercase tracking-widest py-4 px-8 hover:bg-brand-black transition duration-300 flex items-center justify-center gap-3 shadow-md">
                                <span data-translate="btn_interactive">Read Interactive 3D</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2"
                                        d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                                </svg>
                            </button>
                            <button onclick="deleteCustomBook('${id}')"
                                class="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold uppercase tracking-widest py-4 px-8 transition duration-300 flex items-center justify-center gap-3 w-full sm:w-auto">
                                <span data-translate="delete_btn">Remove Book</span>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }

            function renderPDFCover(pdfData, canvas) {
                const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                loadingTask.promise.then(pdf => {
                    pdf.getPage(1).then(page => {
                        const viewport = page.getViewport({ scale: 0.8 });
                        const context = canvas.getContext('2d');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        page.render(renderContext).promise.catch(err => console.error("Cover render error:", err));
                    });
                }).catch(err => {
                    console.error("Error reading PDF for cover:", err);
                });
            }

            function setupUploadListeners() {
                const zone = document.getElementById("pdf-upload-zone");
                const fileInput = document.getElementById("pdf-file-input");
                const errorMsg = document.getElementById("upload-error-msg");

                if (!zone || !fileInput) return;

                zone.onclick = () => fileInput.click();

                zone.ondragover = (e) => {
                    e.preventDefault();
                    zone.classList.add("border-brand-blue", "bg-blue-50/20");
                };

                zone.ondragleave = () => {
                    zone.classList.remove("border-brand-blue", "bg-blue-50/20");
                };

                zone.ondrop = (e) => {
                    e.preventDefault();
                    zone.classList.remove("border-brand-blue", "bg-blue-50/20");
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        handlePDFFile(files[0]);
                    }
                };

                fileInput.onchange = (e) => {
                    const files = e.target.files;
                    if (files.length > 0) {
                        handlePDFFile(files[0]);
                    }
                };

                function showError(msg) {
                    errorMsg.innerText = msg;
                    errorMsg.classList.remove("hidden");
                }

                function clearError() {
                    errorMsg.classList.add("hidden");
                }

                function handlePDFFile(file) {
                    if (file.type !== "application/pdf") {
                        showError(currentLang === 'BN' ? "শুধুমাত্র PDF ফাইল আপলোড করা যাবে।" : "Only PDF files are supported.");
                        return;
                    }

                    if (file.size > 20 * 1024 * 1024) {
                        showError(currentLang === 'BN' ? "ফাইলের সাইজ ২০ এমবি এর চেয়ে কম হতে হবে।" : "File size must be under 20MB.");
                        return;
                    }

                    clearError();

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const arrayBuffer = event.target.result;
                            const bookId = "pdf-" + Date.now();
                            const title = file.name.replace(/\.[^/.]+$/, "");

                            const book = {
                                id: bookId,
                                title: title,
                                data: arrayBuffer,
                                size: file.size,
                                addedAt: new Date().toISOString()
                            };

                            await saveBookToDB(book);
                            await loadCustomBooks();
                        } catch (err) {
                            console.error("Error saving PDF:", err);
                            showError(currentLang === 'BN' ? "পিডিএফ সেভ করতে সমস্যা হয়েছে।" : "Failed to save PDF to shelf.");
                        }
                    };
                    reader.readAsArrayBuffer(file);
                }
            }

            async function deleteCustomBook(id) {
                if (confirm(currentLang === 'BN' ? "আপনি কি এই বইটি শেলফ থেকে মুছে ফেলতে চান?" : "Are you sure you want to remove this book from your shelf?")) {
                    try {
                        if (uploadedBooksCache[id] && uploadedBooksCache[id].blobUrl) {
                            URL.revokeObjectURL(uploadedBooksCache[id].blobUrl);
                            delete uploadedBooksCache[id];
                        }
                        await deleteBookFromDB(id);
                        await loadCustomBooks();
                    } catch (err) {
                        console.error("Error deleting book:", err);
                    }
                }
            }

            document.addEventListener("DOMContentLoaded", function () {
                // Initialize custom books shelf & upload listeners
                loadCustomBooks();
                setupUploadListeners();

                // Setup local PDF links
                const pdfUrlBn = "islamic_or_commercial_2026.pdf";
                const pdfUrlEn = "is_society_islamic_or_commercial_2026.pdf";

                const pdfLinkBn = document.getElementById("pdf-link-bn");
                if (pdfLinkBn) pdfLinkBn.href = pdfUrlBn;
                const pdfLinkEn = document.getElementById("pdf-link-en");
                if (pdfLinkEn) pdfLinkEn.href = pdfUrlEn;

                const btn3dBn = document.getElementById("btn-3d-bn");
                if (btn3dBn) btn3dBn.setAttribute("onclick", `open3DBook('${pdfUrlBn}', 'BN')`);
                const btn3dEn = document.getElementById("btn-3d-en");
                if (btn3dEn) btn3dEn.setAttribute("onclick", `open3DBook('${pdfUrlEn}', 'EN')`);

                // Initialize Excel data & Packed Images first, then fetch CMS texts
                initExcelAndImages().then(() => {
                    fetch(webAppUrl)
                        .then(response => response.json())
                        .then(data => {
                            cmsTexts = data.texts || {};
                            updatePageContent();
                        })
                        .catch(error => {
                            console.error("Error loading dynamic text content:", error);
                            // Ensure translations apply even if the live CMS fetch fails (offline/CORS blocked)
                            updatePageContent();
                        });
                });
            });

            // ==============================================
            // 3D BOOK MODAL VIEW LOGIC & PDF.JS RENDERING
            // ==============================================
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

            let modalPages = [];
            let modalCurrentPage = 0;

            // fallbackBooks is loaded dynamically from data.xlsx (no hardcoded fallback data here)

            function open3DBook(bookId, lang) {
                document.getElementById('book3DModal').classList.remove('hidden');
                document.getElementById('book-loader').style.display = 'flex';
                document.getElementById('modal-book-element').style.display = 'none';
                document.getElementById('book-controls').style.display = 'none';
                document.getElementById('book-swipe-tip').style.display = 'none';
                document.getElementById('loader-text').innerText = "Loading Book Content...";

                // Case 1: Custom uploaded book
                if (bookId && bookId.startsWith('pdf-')) {
                    const cachedBook = uploadedBooksCache[bookId];
                    if (cachedBook && cachedBook.arrayBuffer) {
                        setTimeout(() => {
                            renderPDFBook(cachedBook.arrayBuffer);
                        }, 200);
                    } else {
                        getBookFromDB(bookId).then(book => {
                            if (book) {
                                renderPDFBook(book.data);
                            } else {
                                document.getElementById('loader-text').innerText = "Book not found.";
                            }
                        }).catch(err => {
                            console.error("DB retrieve error:", err);
                            document.getElementById('loader-text').innerText = "Error loading book.";
                        });
                    }
                    return;
                }

                // Case 2: Default books passed as PDF URLs
                const isPdfUrl = bookId && bookId.toLowerCase().endsWith('.pdf');
                if (isPdfUrl) {
                    // Determine static fallback (in case fetch fails or hangs)
                    let fallbackId = "book1";
                    if (bookId.includes("Corporate") || bookId.includes("book2")) {
                        fallbackId = "book2";
                    }

                    // Check if PDF data is embedded locally in pdf_data.js to bypass CORS
                    if (typeof pdfData !== 'undefined' && pdfData[bookId]) {
                        try {
                            const b64Data = pdfData[bookId];
                            const binaryString = atob(b64Data);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            renderPDFBook(bytes.buffer, fallbackId, lang);
                            return;
                        } catch (e) {
                            console.error("Error decoding embedded PDF data:", e);
                        }
                    }

                    // Use encodeURI so Bengali/Unicode filenames and spaces are handled properly
                    const encodedUrl = encodeURI(bookId);

                    // Set a safety timeout: if fetch hasn't resolved in 6s, fall back to static slides
                    let fetchTimedOut = false;
                    const timeoutHandle = setTimeout(() => {
                        fetchTimedOut = true;
                        console.warn("PDF fetch timed out. Falling back to static slides.");
                        renderBookFromData(fallbackId, lang);
                    }, 6000);

                    fetch(encodedUrl)
                        .then(response => {
                            if (!response.ok) throw new Error("Network response not ok: " + response.status);
                            return response.arrayBuffer();
                        })
                        .then(arrayBuffer => {
                            clearTimeout(timeoutHandle);
                            if (!fetchTimedOut) {
                                renderPDFBook(arrayBuffer, fallbackId, lang);
                            }
                        })
                        .catch(error => {
                            clearTimeout(timeoutHandle);
                            if (!fetchTimedOut) {
                                console.warn("Failed to fetch PDF (possibly local CORS or missing file). Falling back to static book slides.", error);
                                renderBookFromData(fallbackId, lang);
                            }
                        });
                    return;
                }

                // Case 3: Standard target bookId key
                let targetBookId = bookId;
                if (!bookId || bookId === '#') {
                    targetBookId = 'book1';
                }

                setTimeout(() => {
                    renderBookFromData(targetBookId, lang);
                }, 600);
            }

            async function renderPDFBook(pdfData, fallbackId, lang) {
                const container = document.getElementById('modal-book-element');
                container.innerHTML = '';
                modalPages = [];
                modalCurrentPage = 0;
                container.style.transform = 'translateX(0)';

                document.getElementById('loader-text').innerText = "Processing PDF pages...";

                try {
                    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                    const numPages = pdf.numPages;
                    const totalLeaves = Math.ceil(numPages / 2);

                    for (let i = 0; i < totalLeaves; i++) {
                        const pageDiv = document.createElement('div');
                        pageDiv.className = 'modal-page';

                        // Front page: 2 * i + 1
                        const frontDiv = document.createElement('div');
                        frontDiv.className = 'modal-front p-0 bg-white relative';
                        const pageNumFront = 2 * i + 1;
                        if (pageNumFront === 1) {
                            frontDiv.classList.add('modal-cover-front');
                        }

                        const canvasFront = document.createElement('canvas');
                        canvasFront.className = "w-full h-full object-contain";
                        frontDiv.appendChild(canvasFront);

                        const numSpanFront = document.createElement('span');
                        numSpanFront.className = "absolute bottom-2 right-4 text-[10px] font-bold text-gray-400 z-10 bg-white/80 px-1.5 py-0.5 rounded";
                        numSpanFront.innerText = pageNumFront;
                        frontDiv.appendChild(numSpanFront);
                        pageDiv.appendChild(frontDiv);

                        // Back page: 2 * i + 2
                        const backDiv = document.createElement('div');
                        backDiv.className = 'modal-back p-0 bg-slate-50 relative';
                        const pageNumBack = 2 * i + 2;

                        let canvasBack = null;
                        if (pageNumBack <= numPages) {
                            canvasBack = document.createElement('canvas');
                            canvasBack.className = "w-full h-full object-contain";
                            backDiv.appendChild(canvasBack);

                            const numSpanBack = document.createElement('span');
                            numSpanBack.className = "absolute bottom-2 left-4 text-[10px] font-bold text-gray-400 z-10 bg-white/80 px-1.5 py-0.5 rounded";
                            numSpanBack.innerText = pageNumBack;
                            backDiv.appendChild(numSpanBack);
                        } else {
                            backDiv.classList.add('modal-cover-back');
                            backDiv.innerHTML = `
                                <div class="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-950 opacity-90 z-0"></div>
                                <h2 class="relative z-10 text-2xl border-none text-white">The End</h2>
                            `;
                        }
                        pageDiv.appendChild(backDiv);
                        container.appendChild(pageDiv);
                        modalPages.push(pageDiv);

                        // Render PDF pages asynchronously
                        renderPageOnCanvas(pdf, pageNumFront, canvasFront);
                        if (pageNumBack <= numPages) {
                            renderPageOnCanvas(pdf, pageNumBack, canvasBack);
                        }
                    }

                    modalPages.forEach((page, index) => {
                        page.style.zIndex = modalPages.length - index;
                    });

                    document.getElementById('book-loader').style.display = 'none';
                    document.getElementById('modal-book-element').style.display = 'block';
                    document.getElementById('book-controls').style.display = 'flex';
                    document.getElementById('book-swipe-tip').style.display = 'block';

                    adjustBookScaleAndPosition();
                    setupModalSwipeHandlers();

                } catch (err) {
                    console.error("Error parsing PDF document, falling back to static slides:", err);
                    if (fallbackId && lang) {
                        renderBookFromData(fallbackId, lang);
                    } else {
                        document.getElementById('loader-text').innerText = "Failed to load PDF pages.";
                    }
                }
            }

            async function renderPageOnCanvas(pdf, pageNum, canvas) {
                try {
                    const page = await pdf.getPage(pageNum);
                    const ctx = canvas.getContext('2d');
                    const viewport = page.getViewport({ scale: 1.5 });
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };
                    await page.render(renderContext).promise;
                } catch (err) {
                    console.error(`Error rendering page ${pageNum}:`, err);
                }
            }

            function renderBookFromData(bookId, lang) {
                const bookData = fallbackBooks[bookId] || fallbackBooks['book1'];
                const data = bookData[lang] || bookData['BN'];
                const container = document.getElementById('modal-book-element');
                container.innerHTML = '';
                modalPages = [];
                modalCurrentPage = 0;
                container.style.transform = 'translateX(0)';

                data.pages.forEach((pageGroup) => {
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'modal-page';

                    const frontDiv = document.createElement('div');
                    frontDiv.className = 'modal-front';
                    if (pageGroup.front.type === 'cover') {
                        frontDiv.classList.add('modal-cover-front');
                        frontDiv.innerHTML = `
                        <div class="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-950 opacity-90 z-0"></div>
                        <h1 class="relative z-10">${pageGroup.front.title}</h1>
                        <div class="modal-context relative z-10 text-gray-200 mt-6">${pageGroup.front.context}</div>
                        <div class="modal-author relative z-10 text-slate-400 mt-12">${pageGroup.front.author}</div>
                    `;
                    } else {
                        const verseHTML = pageGroup.front.verse ? `<div class="mt-auto border-t border-gray-200 pt-2 text-[10px] italic text-[#475569] leading-snug">${pageGroup.front.verse}</div>` : '';
                        frontDiv.innerHTML = `
                        <h2 class="text-base md:text-lg font-bold border-b pb-1.5 mb-3 text-[#0f172a]">${pageGroup.front.title}</h2>
                        <p class="text-xs md:text-sm text-[#334155] leading-relaxed text-justify mb-3">${pageGroup.front.text}</p>
                        ${verseHTML}
                        <span class="absolute bottom-3 right-5 font-bold text-xs text-[#94a3b8]">${pageGroup.front.num}</span>
                    `;
                    }
                    pageDiv.appendChild(frontDiv);

                    const backDiv = document.createElement('div');
                    backDiv.className = 'modal-back';
                    if (pageGroup.back.type === 'cover-back') {
                        backDiv.classList.add('modal-cover-back');
                        backDiv.innerHTML = `
                        <div class="absolute inset-0 bg-gradient-to-br from-indigo-950 to-slate-950 opacity-90 z-0"></div>
                        <h2 class="relative z-10 text-2xl border-none">${pageGroup.back.title}</h2>
                    `;
                    } else {
                        const verseHTML = pageGroup.back.verse ? `<div class="mt-auto border-t border-gray-200 pt-2 text-[10px] italic text-[#475569] leading-snug">${pageGroup.back.verse}</div>` : '';
                        backDiv.innerHTML = `
                        <h2 class="text-base md:text-lg font-bold border-b pb-1.5 mb-3 text-[#0f172a]">${pageGroup.back.title}</h2>
                        <p class="text-xs md:text-sm text-[#334155] leading-relaxed text-justify mb-3">${pageGroup.back.text}</p>
                        ${verseHTML}
                        <span class="absolute bottom-3 left-5 font-bold text-xs text-[#94a3b8]">${pageGroup.back.num}</span>
                    `;
                    }
                    pageDiv.appendChild(backDiv);

                    container.appendChild(pageDiv);
                    modalPages.push(pageDiv);
                });

                modalPages.forEach((page, index) => {
                    page.style.zIndex = modalPages.length - index;
                });

                document.getElementById('book-loader').style.display = 'none';
                document.getElementById('modal-book-element').style.display = 'block';
                document.getElementById('book-controls').style.display = 'flex';
                document.getElementById('book-swipe-tip').style.display = 'block';

                adjustBookScaleAndPosition();
                setupModalSwipeHandlers();
            }

            function close3DBook() {
                document.getElementById('book3DModal').classList.add('hidden');
                document.getElementById('modal-book-element').innerHTML = '';
                modalCurrentPage = 0;
            }

            function flipModalNext() {
                if (modalCurrentPage < modalPages.length) {
                    let current = modalCurrentPage;
                    modalPages[current].classList.add('flipped');
                    setTimeout(() => {
                        modalPages[current].style.zIndex = current + 1;
                    }, 400);
                    modalCurrentPage++;
                    adjustBookScaleAndPosition();
                }
            }

            function flipModalPrev() {
                if (modalCurrentPage > 0) {
                    modalCurrentPage--;
                    let current = modalCurrentPage;
                    modalPages[current].classList.remove('flipped');
                    setTimeout(() => {
                        modalPages[current].style.zIndex = modalPages.length - current;
                    }, 400);
                    adjustBookScaleAndPosition();
                }
            }

            function adjustBookScaleAndPosition() {
                const modalBook = document.getElementById('modal-book-element');
                if (!modalBook || document.getElementById('book3DModal').classList.contains('hidden')) return;

                const W = window.innerWidth;
                const H = window.innerHeight;

                const basePageWidth = 380;
                const basePageHeight = 538;

                const maxW = W - 32;
                const maxH = H - 160;

                const scaleX = maxW / (basePageWidth * 2);
                const scaleY = maxH / basePageHeight;
                const scale = Math.max(0.2, Math.min(scaleX, scaleY, 1.15));

                let tx = 0;
                if (modalCurrentPage === 0) {
                    tx = 0;
                } else if (modalCurrentPage === modalPages.length) {
                    tx = basePageWidth;
                } else {
                    tx = basePageWidth / 2;
                }

                modalBook.style.transform = `scale(${scale}) translateX(${tx}px)`;
            }

            window.addEventListener('resize', adjustBookScaleAndPosition);

            function setupModalSwipeHandlers() {
                const modalBook = document.getElementById('modal-book-element');
                let startX = 0;
                let isDragging = false;

                modalBook.onmousedown = (e) => {
                    startX = e.clientX;
                    isDragging = true;
                };

                window.onmouseup = (e) => {
                    if (!isDragging) return;
                    isDragging = false;
                    let difference = startX - e.clientX;
                    const bookRect = modalBook.getBoundingClientRect();

                    if (Math.abs(difference) > 40) {
                        if (difference > 0) {
                            flipModalNext();
                        } else {
                            flipModalPrev();
                        }
                    } else {
                        let clickX = startX - bookRect.left;
                        if (clickX > bookRect.width / 2) {
                            flipModalNext();
                        } else {
                            flipModalPrev();
                        }
                    }
                };

                modalBook.ontouchstart = (e) => {
                    startX = e.touches[0].clientX;
                    isDragging = true;
                };

                modalBook.ontouchend = (e) => {
                    if (!isDragging) return;
                    isDragging = false;
                    let difference = startX - e.changedTouches[0].clientX;
                    const bookRect = modalBook.getBoundingClientRect();

                    if (Math.abs(difference) > 40) {
                        if (difference > 0) {
                            flipModalNext();
                        } else {
                            flipModalPrev();
                        }
                    } else {
                        let clickX = startX - bookRect.left;
                        if (clickX > bookRect.width / 2) {
                            flipModalNext();
                        } else {
                            flipModalPrev();
                        }
                    }
                };
            }

            
        function openGameProjectsModal() {
            const modal = document.getElementById('gameProjectsModal');
            if (modal) modal.classList.remove('hidden');
        }

        function closeGameProjectsModal() {
            const modal = document.getElementById('gameProjectsModal');
            if (modal) modal.classList.add('hidden');
        }

        function openSocialMediaModal() {
                document.getElementById('socialMediaModal').classList.remove('hidden');
            }

            function closeSocialMediaModal() {
                const modal = document.getElementById('socialMediaModal');
                // Stop youtube video playing in background when modal closed
                const iframes = modal.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    const src = iframe.src;
                    iframe.src = src;
                });
                modal.classList.add('hidden');
            }

            function openCertificateSidebar(imageSrc) {
                const backdrop = document.getElementById('certificateBackdrop');
                const modalContent = document.getElementById('certificateModalContent');
                const img = document.getElementById('certificateImage');
                img.src = imageSrc;
                
                backdrop.classList.remove('hidden');
                setTimeout(() => {
                    backdrop.classList.remove('opacity-0');
                    modalContent.classList.remove('scale-95', 'opacity-0');
                    modalContent.classList.add('scale-100', 'opacity-100');
                }, 10);
            }

            function closeCertificateSidebar() {
                const backdrop = document.getElementById('certificateBackdrop');
                const modalContent = document.getElementById('certificateModalContent');
                
                backdrop.classList.add('opacity-0');
                modalContent.classList.remove('scale-100', 'opacity-100');
                modalContent.classList.add('scale-95', 'opacity-0');
                setTimeout(() => backdrop.classList.add('hidden'), 300);
            }

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (!document.getElementById('book3DModal').classList.contains('hidden')) {
                        close3DBook();
                    } else if (!document.getElementById('socialMediaModal').classList.contains('hidden')) {
                        closeSocialMediaModal();
                    } else if (!document.getElementById('certificateBackdrop').classList.contains('hidden')) {
                        closeCertificateSidebar();
                    } else {
                        closeBooksModal();
                    }
                }
            });
        
        const cardMedia = {
            'game': [
                'Software Logos/OPENBOR.png',
                'Software Logos/MUGEN.png'
            ],
            'diy': [
                'https://img.youtube.com/vi/gTks9WkN-QM/hqdefault.jpg'
            ],
            'social': [
                'https://img.youtube.com/vi/S5iAWErIPj0/hqdefault.jpg'
            ],
            'design': [
                'Graphic Design/SSC Result feature.png',
                'https://placehold.co/600x600/1a1a2e/00AECC?text=Design+2',
                'https://placehold.co/600x600/1a1a2e/00AECC?text=Design+3'
            ]
        };

        const cardState = {
            'game': { index: 0, interval: null },
            'diy': { index: 0, interval: null },
            'social': { index: 0, interval: null },
            'design': { index: 0, interval: null }
        };

        function startCardSlide(cardId, element) {
            const bgDiv = element.querySelector('.card-bg');
            if (!bgDiv) return;
            
            const mediaList = cardMedia[cardId];
            if (!mediaList || mediaList.length === 0) return;
            
            let state = cardState[cardId];
            bgDiv.style.backgroundImage = `url('${mediaList[state.index]}')`;
            
            if (mediaList.length > 1) {
                state.interval = setInterval(() => {
                    state.index = (state.index + 1) % mediaList.length;
                    bgDiv.style.backgroundImage = `url('${mediaList[state.index]}')`;
                }, 1500);
            }
        }

        function stopCardSlide(cardId, element) {
            let state = cardState[cardId];
            if (state.interval) {
                clearInterval(state.interval);
                state.interval = null;
            }
        }

    