

document.addEventListener('DOMContentLoaded', function() {
    // Variabel global
    let schedules = JSON.parse(localStorage.getItem('schedules')) || [];
    let currentEditingId = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    // Elemen DOM
    const scheduleList = document.getElementById('scheduleList');
    const scheduleForm = document.getElementById('scheduleForm');
    const scheduleModal = document.getElementById('scheduleModal');
    const detailModal = document.getElementById('detailModal');
    const shareModal = document.getElementById('shareModal');
    const shareAllModal = document.getElementById('shareAllModal');
    const addScheduleBtn = document.getElementById('addScheduleBtn');
    const shareAllBtn = document.getElementById('shareAllBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const closeDetailModalBtn = document.getElementById('closeDetailModal');
    const closeShareModalBtn = document.getElementById('closeShareModal');
    const closeShareAllModalBtn = document.getElementById('closeShareAllModal');
    const saveScheduleBtn = document.getElementById('saveSchedule');
    const editScheduleBtn = document.getElementById('editSchedule');
    const deleteScheduleBtn = document.getElementById('deleteSchedule');
    const shareScheduleBtn = document.getElementById('shareSchedule');
    const calendarView = document.getElementById('calendarView');
    const monthTitle = document.getElementById('monthTitle');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const shareOptions = document.querySelectorAll('.share-option');
    const linkContainer = document.getElementById('linkContainer');
    const shareLink = document.getElementById('shareLink');
    const copyLinkBtn = document.getElementById('copyLink');
    const linkAllContainer = document.getElementById('linkAllContainer');
    const shareAllLink = document.getElementById('shareAllLink');
    const copyAllLinkBtn = document.getElementById('copyAllLink');

    // Inisialisasi
    renderSchedules();
    renderCalendar();
    checkScheduledEvents();
    handleSharedSchedule();
    
    // Event Listeners
    addScheduleBtn.addEventListener('click', openAddModal);
    shareAllBtn.addEventListener('click', openShareAllModal);
    closeModalBtn.addEventListener('click', closeModal);
    closeDetailModalBtn.addEventListener('click', closeDetailModal);
    closeShareModalBtn.addEventListener('click', closeShareModal);
    closeShareAllModalBtn.addEventListener('click', closeShareAllModal);
    scheduleForm.addEventListener('submit', saveSchedule);
    editScheduleBtn.addEventListener('click', openEditModal);
    deleteScheduleBtn.addEventListener('click', deleteSchedule);
    shareScheduleBtn.addEventListener('click', openShareModal);
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));
    copyLinkBtn.addEventListener('click', copyShareLink);
    copyAllLinkBtn.addEventListener('click', copyAllLink);
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    shareOptions.forEach(option => {
        option.addEventListener('click', () => {
            const method = option.getAttribute('data-method');
            if (option.closest('#shareModal')) {
                shareSchedule(method);
            } else if (option.closest('#shareAllModal')) {
                shareAllSchedules(method);
            }
        });
    });
    
    // Fungsi untuk menampilkan notifikasi
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Fungsi untuk beralih tab
    function switchTab(tabId) {
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        tabContents.forEach(content => {
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
    
    // Fungsi untuk membuka modal tambah
    function openAddModal() {
        document.getElementById('modalTitle').textContent = 'Tambah Jadwal Baru';
        document.getElementById('scheduleId').value = '';
        document.getElementById('title').value = '';
        document.getElementById('date').value = '';
        document.getElementById('time').value = '';
        document.getElementById('description').value = '';
        document.getElementById('reminder').value = '0';
        currentEditingId = null;
        
        // Set tanggal minimal hari ini
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        document.getElementById('date').min = dateStr;
        
        scheduleModal.style.display = 'flex';
    }
    
    // Fungsi untuk membuka modal edit
    function openEditModal() {
        const schedule = schedules.find(s => s.id === currentEditingId);
        if (!schedule) return;
        
        document.getElementById('modalTitle').textContent = 'Edit Jadwal';
        document.getElementById('scheduleId').value = schedule.id;
        document.getElementById('title').value = schedule.title;
        
        const dateTime = new Date(schedule.dateTime);
        const dateStr = dateTime.toISOString().split('T')[0];
        const timeStr = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
        
        document.getElementById('date').value = dateStr;
        document.getElementById('time').value = timeStr;
        document.getElementById('description').value = schedule.description || '';
        document.getElementById('reminder').value = schedule.reminder || '0';
        
        closeDetailModal();
        scheduleModal.style.display = 'flex';
    }
    
    // Fungsi untuk membuka modal berbagi
    function openShareModal() {
        shareModal.style.display = 'flex';
        linkContainer.style.display = 'none';
    }
    
    // Fungsi untuk membuka modal berbagi semua
    function openShareAllModal() {
        if (schedules.length === 0) {
            showNotification('Tidak ada jadwal untuk dibagikan', 'danger');
            return;
        }
        shareAllModal.style.display = 'flex';
        linkAllContainer.style.display = 'none';
    }
    
    // Fungsi untuk menutup modal
    function closeModal() {
        scheduleModal.style.display = 'none';
    }
    
    // Fungsi untuk menutup modal detail
    function closeDetailModal() {
        detailModal.style.display = 'none';
    }
    
    // Fungsi untuk menutup modal share
    function closeShareModal() {
        shareModal.style.display = 'none';
    }
    
    // Fungsi untuk menutup modal share all
    function closeShareAllModal() {
        shareAllModal.style.display = 'none';
    }
    
    // Fungsi untuk menyimpan jadwal
    function saveSchedule(e) {
        e.preventDefault();
        
        const id = document.getElementById('scheduleId').value || generateId();
        const title = document.getElementById('title').value.trim();
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const description = document.getElementById('description').value.trim();
        const reminder = document.getElementById('reminder').value;
        
        const dateTime = new Date(`${date}T${time}`);
        
        const schedule = {
            id,
            title,
            dateTime: dateTime.toISOString(),
            description,
            reminder: parseInt(reminder),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Cek apakah edit atau tambah baru
        const existingIndex = schedules.findIndex(s => s.id === id);
        if (existingIndex >= 0) {
            schedules[existingIndex] = schedule;
            showNotification('Jadwal berhasil diperbarui!', 'success');
        } else {
            schedules.push(schedule);
            showNotification('Jadwal baru berhasil ditambahkan!', 'success');
        }
        
        // Simpan ke localStorage
        localStorage.setItem('schedules', JSON.stringify(schedules));
        
        // Perbarui tampilan
        renderSchedules();
        renderCalendar();
        
        // Tutup modal
        closeModal();
        
        // Tambahkan ke kalender device jika didukung
        if (navigator.calendar) {
            addToDeviceCalendar(schedule);
        } else {
            console.log('API kalender perangkat tidak didukung');
        }
    }
    
    // Fungsi untuk menghasilkan ID unik
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Fungsi untuk merender daftar jadwal
    function renderSchedules() {
        if (schedules.length === 0) {
            scheduleList.innerHTML = '<div class="no-schedules">Tidak ada jadwal. Tambahkan jadwal baru!</div>';
            return;
        }
        
        // Urutkan berdasarkan tanggal terdekat
        schedules.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        scheduleList.innerHTML = '';
        
        schedules.forEach(schedule => {
            const dateTime = new Date(schedule.dateTime);
            const dateStr = dateTime.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
            const timeStr = dateTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const scheduleElement = document.createElement('div');
            scheduleElement.className = 'schedule-card';
            scheduleElement.innerHTML = `
                <div class="schedule-title">${schedule.title}</div>
                <div class="schedule-meta">
                    <span>${dateStr}</span>
                    <span>${timeStr}</span>
                </div>
                ${schedule.description ? `<div class="schedule-desc">${schedule.description}</div>` : ''}
                <div class="schedule-actions">
                    <button class="btn" data-id="${schedule.id}" onclick="viewSchedule('${schedule.id}')">Detail</button>
                </div>
            `;
            
            scheduleList.appendChild(scheduleElement);
        });
    }
    
    // Fungsi untuk melihat detail jadwal (didefinisikan di global scope)
    window.viewSchedule = function(id) {
        const schedule = schedules.find(s => s.id === id);
        if (!schedule) return;
        
        currentEditingId = id;
        
        const dateTime = new Date(schedule.dateTime);
        const dateStr = dateTime.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        const timeStr = dateTime.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let reminderText = 'Tidak ada';
        if (schedule.reminder) {
            if (schedule.reminder < 60) {
                reminderText = `${schedule.reminder} menit sebelum`;
            } else if (schedule.reminder < 1440) {
                const hours = Math.floor(schedule.reminder / 60);
                reminderText = `${hours} jam sebelum`;
            } else {
                const days = Math.floor(schedule.reminder / 1440);
                reminderText = `${days} hari sebelum`;
            }
        }
        
        document.getElementById('detailTitle').textContent = schedule.title;
        document.getElementById('detailDateTime').textContent = `${dateStr}, ${timeStr}`;
        document.getElementById('detailDescription').textContent = schedule.description || '-';
        document.getElementById('detailReminder').textContent = reminderText;
        
        detailModal.style.display = 'flex';
    };
    
    // Fungsi untuk menghapus jadwal
    function deleteSchedule() {
        if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
        
        const index = schedules.findIndex(s => s.id === currentEditingId);
        if (index >= 0) {
            const deletedSchedule = schedules[index];
            
            // Hapus dari kalender device jika didukung
            if (navigator.calendar) {
                removeFromDeviceCalendar(deletedSchedule);
            }
            
            schedules.splice(index, 1);
            localStorage.setItem('schedules', JSON.stringify(schedules));
            
            showNotification('Jadwal berhasil dihapus!', 'success');
            renderSchedules();
            renderCalendar();
            closeDetailModal();
        }
    }
    
    // Fungsi untuk merender kalender
    function renderCalendar() {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        // Update judul bulan
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Header hari
        const dayNames = ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        calendarView.innerHTML = '';
        
        dayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-header';
            dayElement.textContent = day;
            calendarView.appendChild(dayElement);
        });
        
        // Hari kosong di awal bulan
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarView.appendChild(emptyDay);
        }
        
        // Hari dalam bulan
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Cek apakah hari ini
            if (isCurrentMonth && day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Cek apakah ada jadwal di hari ini
            const dayDate = new Date(currentYear, currentMonth, day);
            const hasEvent = schedules.some(s => {
                const sDate = new Date(s.dateTime);
                return sDate.getDate() === dayDate.getDate() && 
                       sDate.getMonth() === dayDate.getMonth() && 
                       sDate.getFullYear() === dayDate.getFullYear();
            });
            
            if (hasEvent) {
                dayElement.classList.add('has-event');
            }
            
            dayElement.innerHTML = `<div class="day-number">${day}</div>`;
            
            // Tambahkan event click untuk melihat jadwal di hari tersebut
            dayElement.addEventListener('click', () => {
                viewDaySchedules(dayDate);
            });
            
            calendarView.appendChild(dayElement);
        }
    }
    
    // Fungsi untuk melihat jadwal di hari tertentu
    function viewDaySchedules(dayDate) {
        const daySchedules = schedules.filter(s => {
            const sDate = new Date(s.dateTime);
            return sDate.getDate() === dayDate.getDate() && 
                   sDate.getMonth() === dayDate.getMonth() && 
                   sDate.getFullYear() === dayDate.getFullYear();
        });
        
        if (daySchedules.length === 0) {
            alert(`Tidak ada jadwal pada ${dayDate.toLocaleDateString('id-ID')}`);
            return;
        }
        
        let message = `Jadwal pada ${dayDate.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        })}:\n\n`;
        
        daySchedules.forEach(s => {
            const time = new Date(s.dateTime).toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            message += `- ${time}: ${s.title}\n`;
        });
        
        alert(message);
    }
    
    // Fungsi untuk mengubah bulan
    function changeMonth(offset) {
        currentMonth += offset;
        
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        } else if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        
        renderCalendar();
    }
    
    // Fungsi untuk menambahkan ke kalender perangkat
    async function addToDeviceCalendar(schedule) {
        try {
            const calendar = await navigator.calendar.getCalendars();
            if (calendar.length === 0) {
                console.log('Tidak ada kalender yang tersedia');
                return;
            }
            
            const event = {
                calendarId: calendar[0].id,
                title: schedule.title,
                start: new Date(schedule.dateTime),
                end: new Date(new Date(schedule.dateTime).getTime() + 3600000), // +1 jam
                description: schedule.description || '',
                reminders: schedule.reminder ? [{ minutes: schedule.reminder }] : []
            };
            
            await navigator.calendar.createEvent(event);
            console.log('Event ditambahkan ke kalender perangkat');
        } catch (error) {
            console.error('Gagal menambahkan ke kalender:', error);
        }
    }
    
    // Fungsi untuk menghapus dari kalender perangkat
    async function removeFromDeviceCalendar(schedule) {
        try {
            const events = await navigator.calendar.findEvents({
                start: new Date(new Date(schedule.dateTime).getTime() - 86400000), // 1 hari sebelumnya
                end: new Date(new Date(schedule.dateTime).getTime() + 86400000),    // 1 hari setelahnya
                title: schedule.title
            });
            
            if (events.length > 0) {
                await navigator.calendar.deleteEvent(events[0].id);
                console.log('Event dihapus dari kalender perangkat');
            }
        } catch (error) {
            console.error('Gagal menghapus dari kalender:', error);
        }
    }
    
    // Fungsi untuk memeriksa jadwal yang akan datang
    function checkScheduledEvents() {
        const now = new Date();
        const upcomingSchedules = schedules.filter(s => {
            const eventTime = new Date(s.dateTime);
            const diffInMinutes = (eventTime - now) / (1000 * 60);
            return diffInMinutes > 0 && diffInMinutes <= 5; // 5 menit ke depan
        });
        
        upcomingSchedules.forEach(schedule => {
            const eventTime = new Date(schedule.dateTime);
            const timeStr = eventTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            setTimeout(() => {
                if (Notification.permission === 'granted') {
                    new Notification(`Jadwal: ${schedule.title}`, {
                        body: `Waktu: ${timeStr}\n${schedule.description || ''}`,
                        icon: '/icon.png'
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification(`Jadwal: ${schedule.title}`, {
                                body: `Waktu: ${timeStr}\n${schedule.description || ''}`,
                                icon: '/icon.png'
                            });
                        }
                    });
                }
                
                // Fallback ke alert jika notifikasi tidak didukung/diizinkan
                alert(`Pengingat: ${schedule.title}\nWaktu: ${timeStr}\n${schedule.description || ''}`);
            }, (eventTime - now) - (5 * 60 * 1000)); // 5 menit sebelum
        });
        
        // Periksa setiap menit
        setTimeout(checkScheduledEvents, 60000);
    }
    
    // Fungsi untuk berbagi jadwal
    function shareSchedule(method) {
        const schedule = schedules.find(s => s.id === currentEditingId);
        if (!schedule) return;
        
        const dateTime = new Date(schedule.dateTime);
        const dateStr = dateTime.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        const timeStr = dateTime.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const shareText = `📅 Jadwal: ${schedule.title}\n` +
                         `📅 Tanggal: ${dateStr}\n` +
                         `⏰ Waktu: ${timeStr}\n` +
                         `📝 Deskripsi: ${schedule.description || '-'}\n` +
                         `\nDikirim dari MySchedule App`;
        
        // Buat link unik untuk jadwal ini
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${schedule.id}`;
        
        if (method === 'whatsapp') {
            // Berbagi via WhatsApp
            if (navigator.share) {
                navigator.share({
                    title: `Jadwal: ${schedule.title}`,
                    text: shareText,
                    url: shareUrl
                }).catch(err => {
                    console.log('Error sharing:', err);
                    fallbackShare(shareText, shareUrl);
                });
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
            }
        } else if (method === 'email') {
            // Berbagi via Email
            window.open(`mailto:?subject=Jadwal: ${schedule.title}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`);
        } else if (method === 'link') {
            // Tampilkan link untuk disalin
            shareLink.value = shareUrl;
            linkContainer.style.display = 'block';
        }
    }
    
    // Fungsi untuk berbagi semua jadwal
    function shareAllSchedules(method) {
        if (schedules.length === 0) return;
        
        // Urutkan jadwal berdasarkan tanggal
        const sortedSchedules = [...schedules].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        // Format teks untuk dibagikan
        let shareText = `📅 Daftar Semua Jadwal\n\n`;
        let currentMonthYear = '';
        
        sortedSchedules.forEach((schedule, index) => {
            const dateTime = new Date(schedule.dateTime);
            const monthYear = dateTime.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            const dateStr = dateTime.toLocaleDateString('id-ID', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
            const timeStr = dateTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Tambahkan header bulan jika berbeda dengan sebelumnya
            if (monthYear !== currentMonthYear) {
                shareText += `\n📌 ${monthYear}\n`;
                currentMonthYear = monthYear;
            }
            
            shareText += `\n${index + 1}. ${schedule.title}\n`;
            shareText += `   📅 ${dateStr}\n`;
            shareText += `   ⏰ ${timeStr}\n`;
            if (schedule.description) {
                shareText += `   📝 ${schedule.description}\n`;
            }
        });
        
        shareText += `\nDikirim dari MySchedule App`;
        
        // Buat link unik untuk semua jadwal
        const shareUrl = `${window.location.origin}${window.location.pathname}?shareAll=1`;
        
        if (method === 'whatsapp') {
            // Berbagi via WhatsApp
            if (navigator.share) {
                navigator.share({
                    title: `Daftar Semua Jadwal`,
                    text: shareText,
                    url: shareUrl
                }).catch(err => {
                    console.log('Error sharing:', err);
                    fallbackShare(shareText, shareUrl);
                });
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
            }
        } else if (method === 'email') {
            // Berbagi via Email
            window.open(`mailto:?subject=Daftar Semua Jadwal&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`);
        } else if (method === 'link') {
            // Tampilkan link untuk disalin
            shareAllLink.value = shareUrl;
            linkAllContainer.style.display = 'block';
        }
    }
    
    // Fallback untuk Web Share API
    function fallbackShare(text, url) {
        alert(`Salin teks berikut untuk berbagi:\n\n${text}\n\nLink: ${url}`);
    }
    
    // Fungsi untuk menyalin link
    function copyShareLink() {
        shareLink.select();
        document.execCommand('copy');
        showNotification('Link berhasil disalin!', 'success');
    }
    
    // Fungsi untuk menyalin link semua jadwal
    function copyAllLink() {
        shareAllLink.select();
        document.execCommand('copy');
        showNotification('Link berhasil disalin!', 'success');
    }
    
    // Fungsi untuk menangani jadwal yang dibagikan via URL
    function handleSharedSchedule() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('share');
        const shareAll = urlParams.get('shareAll');
        
        if (sharedId) {
            const sharedSchedule = schedules.find(s => s.id === sharedId);
            if (sharedSchedule) {
                // Hapus parameter dari URL tanpa reload
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Tampilkan jadwal yang dibagikan
                setTimeout(() => {
                    viewSchedule(sharedId);
                }, 500);
            } else {
                showNotification('Jadwal tidak ditemukan', 'danger');
            }
        } else if (shareAll) {
            // Hapus parameter dari URL tanpa reload
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Buka tab list dan scroll ke atas
            switchTab('list');
            window.scrollTo(0, 0);
            
            showNotification('Berhasil membuka daftar semua jadwal', 'success');
        }
    }
    
    // Minta izin notifikasi saat pertama kali dimuat
    if ('Notification' in window) {
        Notification.requestPermission();
    }
});