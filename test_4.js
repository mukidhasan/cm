
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'brand-blue': '#00AECC',
                        'brand-black': '#1a1a2e',
                    },
                    fontFamily: {
                        'heading': ['Anton', 'sans-serif'],
                        'body': ['Inter', 'sans-serif'],
                        'signature': ['"Brush Script MT"', 'cursive']
                    }
                }
            }
        }

        function handleMissingImage(img, filename) {
            if (img.src && img.src.includes('data:image/gif')) return;
            const parent = img.parentElement;
            img.style.display = 'none';
            if (!parent.querySelector('.error-box')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = "error-box absolute inset-0 flex flex-col items-center justify-center p-4 bg-gray-900/50 border border-dashed border-gray-700 text-center z-0";
                errorDiv.innerHTML = `<svg class="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span class="text-[10px] font-mono font-bold text-gray-500">${filename}</span><span class="text-[8px] uppercase tracking-wider font-bold text-gray-600 mt-1">(Missing)</span>`;
                parent.insertBefore(errorDiv, img.nextSibling);
            }
        }

        let isTransitioning = false; // kept for compatibility

        function scrollToSection(id) {
            const el = document.getElementById(id);
            if (el) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
                window.scrollTo({ top, behavior: 'smooth' });
            }
            // Close mobile menu if open
            const menu = document.getElementById('mobileNavMenu');
            if (menu && !menu.classList.contains('hidden')) {
                toggleMobileMenu();
            }
        }

        // Legacy switchTab support (for footer/other buttons)
        function switchTab(tabId) {
            if (tabId === 'contact') {
                scrollToSection('section-contact');
            } else if (tabId === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                scrollToSection('section-' + tabId);
            }
        }



        function toggleMobileMenu() {
            const menu = document.getElementById('mobileNavMenu');
            const iconPath = document.getElementById('hamburgerIcon');
            if (menu.classList.contains('hidden')) {
                menu.classList.remove('hidden');
                iconPath.setAttribute('d', 'M6 18L18 6M6 6l12 12');
            } else {
                menu.classList.add('hidden');
                iconPath.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            }
        }

        function openModal() {
            document.getElementById('section-contact').scrollIntoView({ behavior: 'smooth' });
        }

        function closeModal() {
            // no-op in single-page layout
        }

        function openDiyConceptModal() {
            const modal = document.getElementById('diyConceptModal');
            if (modal) modal.classList.remove('hidden');
        }

        function closeDiyConceptModal() {
            const modal = document.getElementById('diyConceptModal');
            if (modal) modal.classList.add('hidden');
        }

        
        function openLightbox(imgSrc) {
            const lightbox = document.getElementById('imageLightbox');
            const lightboxImg = document.getElementById('lightboxImage');
            if (lightbox && lightboxImg) {
                lightboxImg.src = imgSrc;
                lightbox.classList.remove('hidden');
            }
        }

        function closeLightbox() {
            const lightbox = document.getElementById('imageLightbox');
            if (lightbox) {
                lightbox.classList.add('hidden');
            }
        }

        function openGraphicDesignModal() {
            const modal = document.getElementById('graphicDesignModal');
            if (modal) modal.classList.remove('hidden');
        }

        function closeGraphicDesignModal() {
            const modal = document.getElementById('graphicDesignModal');
            if (modal) modal.classList.add('hidden');
        }

        function openBooksModal() {
            document.getElementById('section-books').scrollIntoView({ behavior: 'smooth' });
        }

        function closeBooksModal() {
            // no-op in single-page layout
        }

        function handleFormSubmit(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const submitBtn = document.getElementById('submitBtn');
            const btnOriginalText = submitBtn.innerHTML;
            const name = formData.get('name'), companyWeb = formData.get('company_web') || '', address = formData.get('address'), houseHolding = formData.get('house_holding') || '', phone = formData.get('phone'), subject = formData.get('subject'), helpSector = formData.get('help_sector') || '';
            const sendMethod = document.getElementById('sendMethod').value;

            const currentLang = localStorage.getItem('lang') || 'EN';

            if (sendMethod !== 'server') {
                openDirectCompose(sendMethod);
                form.reset();
                closeModal();
                return;
            }

            const sendingText = currentLang === 'BN' ? 'পাঠানো হচ্ছে...' : 'Sending...';

            submitBtn.innerHTML = sendingText;
            submitBtn.disabled = true;

            fetch('https://formsubmit.co/ajax/seamrex@gmail.com', {
                method: 'POST', headers: { 'Accept': 'application/json' }, body: formData
            })
                .then(response => {
                    if (response.ok) { alert(currentLang === 'BN' ? "বার্তা সফলভাবে পাঠানো হয়েছে!" : "Message sent successfully!"); form.reset(); closeModal(); }
                    else { throw new Error("FormSubmit server issue."); }
                })
                .catch(error => {
                    const mailtoSubject = encodeURIComponent(subject);
                    const mailtoBody = encodeURIComponent(`Name: ${name}\nCompany Website: ${companyWeb}\nAddress: ${address}\nHouse/Holding: ${houseHolding}\nPhone Number: ${phone}\nHelp Sector: ${helpSector}\n\n(Write your additional message here...)`);
                    window.location.href = `mailto:seamrex@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
                    form.reset(); closeModal();
                })
                .finally(() => { submitBtn.innerHTML = btnOriginalText; submitBtn.disabled = false; });
        }

        function openDirectCompose(provider) {
            if (!provider) return;
            const name = document.querySelector('input[name="name"]').value;
            const companyWeb = document.querySelector('input[name="company_web"]').value || '';
            const address = document.querySelector('input[name="address"]').value;
            const houseHolding = document.querySelector('input[name="house_holding"]').value || '';
            const phone = document.querySelector('input[name="phone"]').value;
            const subject = document.querySelector('input[name="subject"]').value;
            const helpSector = document.querySelector('select[name="help_sector"]').value || '';

            const currentLang = localStorage.getItem('lang') || 'EN';
            const emailTo = "seamrex@gmail.com";
            const emailSubject = encodeURIComponent(subject || (currentLang === 'BN' ? "যোগাযোগ" : "Contact"));
            const emailBody = encodeURIComponent(`Name: ${name}\nCompany Website: ${companyWeb}\nAddress: ${address}\nHouse/Holding: ${houseHolding}\nPhone: ${phone}\nHelp Sector: ${helpSector}\n\n(Write your additional message here...)`);

            let url = "";
            if (provider === "gmail") {
                url = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailTo}&su=${emailSubject}&body=${emailBody}`;
            } else if (provider === "yahoo") {
                url = `https://compose.mail.yahoo.com/?to=${emailTo}&subj=${emailSubject}&body=${emailBody}`;
            } else if (provider === "outlook") {
                url = `https://outlook.live.com/mail/0/deeplink/compose?to=${emailTo}&subject=${emailSubject}&body=${emailBody}`;
            } else if (provider === "zoho") {
                url = `https://mail.zoho.com/zm/#compose?to=${emailTo}&subject=${emailSubject}&body=${emailBody}`;
            } else if (provider === "mailto") {
                url = `mailto:${emailTo}?subject=${emailSubject}&body=${emailBody}`;
            }

            if (url) {
                window.open(url, '_blank');
            }
        }

        function extractDomain(url) {
            try {
                let hostname = new URL(url).hostname;
                if (hostname.startsWith('www.')) {
                    hostname = hostname.substring(4);
                }
                return hostname;
            } catch (_) {
                return "";
            }
        }

        function verifyCompanyWebsite(url) {
            const statusEl = document.getElementById('web-verify-status');
            const badgeEl = document.getElementById('blue-tick-badge');
            const spinnerEl = document.getElementById('verify-spinner');
            const inputEl = document.getElementById('company_web');

            // Hide everything first
            statusEl.classList.add('hidden');
            badgeEl.classList.add('hidden');
            spinnerEl.classList.remove('hidden');
            inputEl.classList.remove('border-green-500', 'border-red-500');

            if (!url) {
                spinnerEl.classList.add('hidden');
                return;
            }

            // Formatting
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
                inputEl.value = url;
            }

            try {
                new URL(url);
            } catch (_) {
                spinnerEl.classList.add('hidden');
                statusEl.innerText = "404 Not Found";
                statusEl.className = "text-[9px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1";
                statusEl.classList.remove('hidden');
                inputEl.classList.add('border-red-500');
                return;
            }

            // Verify live status (404 not found check)
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
                .then(response => {
                    if (!response.ok) throw new Error("404");
                    return response.json();
                })
                .then(data => {
                    if (!data || !data.contents) throw new Error("404");

                    const domain = extractDomain(url);
                    if (!domain) throw new Error("Invalid Domain");

                    // Secret Rule: Fetch domain info from RDAP to verify age (min 2 years old)
                    return fetch(`https://rdap.org/domain/${domain}`)
                        .then(rdapRes => {
                            if (!rdapRes.ok) {
                                // Fallback: Accept if active but RDAP is unreachable/CORS blocked
                                return { fallback: true };
                            }
                            return rdapRes.json();
                        })
                        .then(rdapData => {
                            spinnerEl.classList.add('hidden');

                            if (rdapData.fallback) {
                                badgeEl.classList.remove('hidden');
                                inputEl.classList.add('border-green-500');
                                return;
                            }

                            let regDateStr = null;
                            if (rdapData.events) {
                                const regEvent = rdapData.events.find(e => e.eventAction === 'registration');
                                if (regEvent && regEvent.eventDate) {
                                    regDateStr = regEvent.eventDate;
                                }
                            }

                            if (regDateStr) {
                                const regDate = new Date(regDateStr);
                                const currentDate = new Date();
                                const diffTime = Math.abs(currentDate - regDate);
                                const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);

                                if (diffYears >= 2) {
                                    badgeEl.classList.remove('hidden');
                                    inputEl.classList.add('border-green-500');
                                } else {
                                    // Fail secret domain age rule
                                    inputEl.classList.add('border-red-500');
                                }
                            } else {
                                // Fallback if registration date not found in events
                                badgeEl.classList.remove('hidden');
                                inputEl.classList.add('border-green-500');
                            }
                        });
                })
                .catch(() => {
                    spinnerEl.classList.add('hidden');
                    statusEl.innerText = "404 Not Found";
                    statusEl.className = "text-[9px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1";
                    statusEl.classList.remove('hidden');
                    inputEl.classList.add('border-red-500');
                });
        }

        function verifyAddress(addressVal) {
            const statusEl = document.getElementById('address-verify-status');
            const spinnerEl = document.getElementById('address-spinner');
            const mapContainer = document.getElementById('map-container');
            const mapIframe = document.getElementById('map-iframe');
            const inputEl = document.getElementById('address');
            const currentLang = localStorage.getItem('lang') || 'EN';

            // Hide and reset
            statusEl.classList.add('hidden');
            spinnerEl.classList.remove('hidden');
            mapContainer.classList.add('hidden');
            inputEl.classList.remove('border-green-500', 'border-red-500');

            if (!addressVal) {
                spinnerEl.classList.add('hidden');
                return;
            }

            // Geocode validation via OpenStreetMap Nominatim
            fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressVal)}&format=json&limit=1`)
                .then(res => res.json())
                .then(data => {
                    spinnerEl.classList.add('hidden');
                    if (data && data.length > 0) {
                        inputEl.classList.add('border-green-500');

                        // Load Google Map Embed
                        const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressVal)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
                        mapIframe.src = embedUrl;
                        mapContainer.classList.remove('hidden');
                    } else {
                        inputEl.classList.add('border-red-500');
                        statusEl.innerText = currentLang === 'BN' ? "ঠিকানা পাওয়া যায়নি" : "Address Not Found";
                        statusEl.className = "text-[9px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1";
                        statusEl.classList.remove('hidden');
                    }
                })
                .catch(() => {
                    spinnerEl.classList.add('hidden');
                    // Fallback to directly embedding search on Google Maps
                    const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressVal)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
                    mapIframe.src = embedUrl;
                    mapContainer.classList.remove('hidden');
                    inputEl.classList.add('border-green-500');
                });
        }

        // ==============================================
        // INTERACTIVE MAP PICKER LOGIC (LEAFLET)
        // ==============================================
        let leafletMap = null;
        let leafletMarker = null;
        let lastGeocodedAddress = "";

        function toggleMapPicker(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const popover = document.getElementById('map-picker-popover');
            if (popover.classList.contains('hidden')) {
                popover.classList.remove('hidden');
                initLeafletMap();
            } else {
                popover.classList.add('hidden');
            }
        }

        function closeMapPicker(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            document.getElementById('map-picker-popover').classList.add('hidden');
        }

        function initLeafletMap() {
            if (!leafletMap) {
                // Default coordinates (Dhaka, Bangladesh)
                const lat = 23.8103;
                const lon = 90.4125;

                leafletMap = L.map('interactive-picker-map').setView([lat, lon], 12);

                L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    attribution: '© Google Maps'
                }).addTo(leafletMap);

                leafletMarker = L.marker([lat, lon], { draggable: true }).addTo(leafletMap);

                // Reverse geocode initial marker location
                reverseGeocode(lat, lon);

                // Map Click Handler
                leafletMap.on('click', function (e) {
                    leafletMarker.setLatLng(e.latlng);
                    reverseGeocode(e.latlng.lat, e.latlng.lng);
                });

                // Marker Dragend Handler
                leafletMarker.on('dragend', function () {
                    const pos = leafletMarker.getLatLng();
                    reverseGeocode(pos.lat, pos.lng);
                });
            }

            // Re-render map sizing
            setTimeout(() => {
                leafletMap.invalidateSize();
            }, 100);
        }

        function reverseGeocode(lat, lon) {
            const statusEl = document.getElementById('picker-status');
            if (!statusEl) return;
            statusEl.innerText = "Resolving location address...";

            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.display_name) {
                        lastGeocodedAddress = data.display_name;
                        statusEl.innerText = data.display_name;
                    } else {
                        statusEl.innerText = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
                        lastGeocodedAddress = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
                    }
                })
                .catch(() => {
                    statusEl.innerText = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
                    lastGeocodedAddress = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
                });
        }

        function confirmPickedLocation(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            if (lastGeocodedAddress) {
                const addressInput = document.getElementById('address');
                if (addressInput) {
                    addressInput.value = lastGeocodedAddress;
                    // Trigger geocode check to update right-hand column Live Map
                    verifyAddress(lastGeocodedAddress);
                }
            }
            closeMapPicker();
        }
    