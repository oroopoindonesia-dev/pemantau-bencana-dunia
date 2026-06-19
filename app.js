// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
}

// Logika Tombol Install PWA
let deferredPrompt;
const btnInstall = document.getElementById('btnInstall');
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    btnInstall.classList.remove('hidden');
});
btnInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
        btnInstall.classList.add('hidden');
    }
});

// --- INISIALISASI GLOBE 3D ---
const myGlobe = Globe()
    (document.getElementById('globeViz'))
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg') // Peta dasar gelap
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundColor('rgba(5, 5, 10, 1)')
    // Efek Cincin Berdenyut (Rings) untuk Bencana
    .ringColor(() => '#ff3b30')
    .ringMaxRadius(7)
    .ringPropagationSpeed(2)
    .ringRepeatPeriod(800);

// Atur posisi awal kamera agar proporsional
myGlobe.controls().autoRotate = true;
myGlobe.controls().autoRotateSpeed = 0.5;

// Responsif saat layar diubah ukurannya
window.addEventListener('resize', () => {
    myGlobe.width(window.innerWidth).height(window.innerHeight);
});
myGlobe.width(window.innerWidth).height(window.innerHeight);


// --- LOGIKA AMBIL DATA GDACS ---
const GDACS_API = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/json";

async function loadData() {
    try {
        const response = await fetch(GDACS_API);
        const data = await response.json();
        const events = data.features || [];

        updateUI(events);
        updateGlobe(events);
    } catch (err) {
        console.error("Gagal memuat data GDACS:", err);
    }
}

function updateUI(events) {
    const alertList = document.getElementById('alertList');
    alertList.innerHTML = '';

    // Update Angka Total
    document.getElementById('totalActive').innerText = events.length;

    // Statistik Counter
    let stats = { EQ: 0, FL: 0, WF: 0, VO: 0 };

    events.forEach(event => {
        const p = event.properties;
        const type = p.eventtype; // EQ, FL, VO, etc.
        if(stats[type] !== undefined) stats[type]++;

        // Pemetaan Ikon dan Warna Alert
        let icon = "⚠️";
        if (type === 'EQ') icon = "📉"; // Gempa
        if (type === 'FL') icon = "🌊"; // Banjir
        if (type === 'VO') icon = "🌋"; // Gunung
        if (type === 'WF') icon = "🔥"; // Kebakaran

        let alertBadge = "text-green-400 bg-green-500/10 border-green-500/20";
        if (p.alertlevel === 'Orange') alertBadge = "text-orange-400 bg-orange-500/10 border-orange-500/20";
        if (p.alertlevel === 'Red') alertBadge = "text-red-400 bg-red-500/10 border-red-500/20";

        // Bikin item list bergaya glassmorphism card
        const card = document.createElement('div');
        card.className = "p-3 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-800/60 transition cursor-pointer text-xs pointer-events-auto flex items-start gap-3";
        card.innerHTML = `
            <div class="p-2 rounded-lg bg-slate-800 border border-white/10 text-base">${icon}</div>
            <div class="flex-1">
                <div class="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span>Baru Saja</span>
                    <span class="px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${alertBadge}">${p.alertlevel || 'Low'}</span>
                </div>
                <h4 class="font-semibold text-slate-200 line-clamp-1">${p.eventname}</h4>
                <p class="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Tipe: ${p.eventtype}</p>
            </div>
        `;
        
        // Klik card untuk fokus ke lokasi bencana di Globe 3D
        card.addEventListener('click', () => {
            const coords = event.geometry.coordinates;
            myGlobe.pointOfView({ lat: coords[1], lng: coords[0], alt: 1.5 }, 1500);
        });

        alertList.appendChild(card);
    });

    // Update Statistik Bars di Panel Kanan
    for (const [key, value] of Object.entries(stats)) {
        document.getElementById(`count-${key}`).innerText = value;
        const percent = events.length > 0 ? (value / events.length) * 100 : 0;
        document.getElementById(`bar-${key}`).style.width = `${percent}%`;
    }

    const now = new Date();
    document.getElementById('updateTime').innerText = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function updateGlobe(events) {
    // Format data koordinat untuk cincin pemancar (Rings Data)
    const ringData = events.map(event => {
        const coords = event.geometry.coordinates;
        return {
            lat: coords[1],
            lng: coords[0]
        };
    });

    myGlobe.ringsData(ringData);
}

// Jalankan saat pertama kali dibuka
document.getElementById('btnRefresh').addEventListener('click', loadData);
window.addEventListener('DOMContentLoaded', loadData);
